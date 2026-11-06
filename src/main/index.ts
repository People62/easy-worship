import { join } from 'node:path'
import { app, BrowserWindow, dialog, Menu, nativeTheme, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import type { DatabaseStatus } from '@shared/ipc'
import { validateSongInput } from '@shared/songs'
import type { AppSettings } from '@shared/settings'
import { formatVersionLabel } from '@shared/version'
import { importLogo, LOGO_EXTENSIONS, logoUrl, removeLogos } from './church/logo'
import { closeDatabase, getDatabase, openDatabase } from './db'
import { listDisplays, watchDisplays } from './displays'
import { broadcast, registerHandlers } from './ipc'
import { LiveStore } from './live/store'
import { OutputManager } from './output/manager'
import { handleEgwProtocol, registerEgwScheme } from './protocol'
import { SettingsStore } from './settings/store'
import { SongRepository } from './songs/repository'

let databaseStatus: DatabaseStatus = { ok: false, error: 'Database not opened yet' }
let operatorWindow: BrowserWindow | null = null

// Must run before the app is ready.
registerEgwScheme()

const PRELOAD = join(__dirname, '../preload/index.js')

function loadPage(window: BrowserWindow, page: 'operator' | 'output'): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${page}/index.html`)
  } else {
    void window.loadFile(join(__dirname, `../renderer/${page}/index.html`))
  }
}

// Matches the window frame and native dialogs to the chosen mode.
function applyNativeTheme(settings: AppSettings): void {
  nativeTheme.themeSource = settings.appearance.mode
}

function createOperatorWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#171412' : '#F7F5F0',
    title: `El-Gibbor Worship ${formatVersionLabel(app.getVersion(), app.isPackaged)}`,
    autoHideMenuBar: true,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.once('ready-to-show', () => window.show())

  // Open external links in the default browser, never inside the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event) => event.preventDefault())

  // The operator window is the app: closing it closes the output too.
  window.on('closed', () => {
    operatorWindow = null
    app.quit()
  })

  loadPage(window, 'operator')
  return window
}

function registerIpc(settings: SettingsStore, live: LiveStore, output: OutputManager): void {
  const userData = app.getPath('userData')
  const db = getDatabase()
  const songRepository = db ? new SongRepository(db) : null
  const songs = (): SongRepository => {
    if (!songRepository)
      throw new Error('Database tidak bisa dibuka, jadi lagu tidak tersedia. Lihat Pengaturan → Tentang.')
    return songRepository
  }
  const songId = (id: unknown): number => {
    if (!Number.isInteger(id) || (id as number) < 1) throw new Error('Nomor lagu tidak valid.')
    return id as number
  }

  registerHandlers({
    'app:get-info': () => ({
      name: app.getName(),
      version: formatVersionLabel(app.getVersion(), app.isPackaged),
      platform: process.platform,
      electron: process.versions.electron,
      database: databaseStatus
    }),
    'settings:get': () => settings.get(),
    'settings:update': (patch) => settings.update(patch),
    'displays:list': () => listDisplays(),
    'live:get': () => live.get(),
    'live:show': (slide) => live.show(slide),
    'live:toggle-overlay': (overlay) => live.toggleOverlay(overlay),
    'live:clear-overlay': () => live.clearOverlay(),
    'output:get-status': () => output.getStatus(),
    'church:choose-logo': async () => {
      const options = {
        title: 'Pilih logo gereja',
        properties: ['openFile' as const],
        filters: [{ name: 'Gambar', extensions: [...LOGO_EXTENSIONS] }]
      }
      const result = operatorWindow
        ? await dialog.showOpenDialog(operatorWindow, options)
        : await dialog.showOpenDialog(options)
      const source = result.filePaths[0]
      if (result.canceled || !source) return null
      const fileName = await importLogo(source, userData)
      return settings.update({ church: { logoFile: fileName } })
    },
    'church:remove-logo': async () => {
      await removeLogos(userData)
      return settings.update({ church: { logoFile: null } })
    },
    'songs:search': (query) => songs().search(typeof query === 'string' ? query.slice(0, 200) : ''),
    'songs:get': (id) => songs().get(songId(id)),
    'songs:create': (input) => {
      const song = songs().create(validateSongInput(input))
      broadcast('songs:changed', song.id)
      return song
    },
    'songs:update': (id, input) => {
      const song = songs().update(songId(id), validateSongInput(input))
      broadcast('songs:changed', song.id)
      return song
    },
    'songs:delete': (id) => {
      songs().delete(songId(id))
      broadcast('songs:changed', id)
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('org.elgibbor.worship')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  // No menu bar: it would add shortcuts such as Ctrl+R (reload) that an
  // operator could press by accident during a service.
  if (app.isPackaged) Menu.setApplicationMenu(null)

  const userData = app.getPath('userData')
  handleEgwProtocol(userData)

  databaseStatus = openDatabase(userData)
  const settings = new SettingsStore(getDatabase())
  const live = new LiveStore()
  const output = new OutputManager({
    preloadPath: PRELOAD,
    loadPage: (window) => loadPage(window, 'output'),
    getSettings: () => settings.get(),
    onStatus: (status) => broadcast('output:status-changed', status)
  })

  applyNativeTheme(settings.get())
  live.setLogo(logoUrl(settings.get().church.logoFile))

  let previous = settings.get()
  settings.onChange((next) => {
    applyNativeTheme(next)
    live.setLogo(logoUrl(next.church.logoFile))
    if (JSON.stringify(next.output) !== JSON.stringify(previous.output)) output.reconcile()
    previous = next
    broadcast('settings:changed', next)
  })
  live.onChange((state) => broadcast('live:changed', state))

  registerIpc(settings, live, output)
  watchDisplays((displays) => broadcast('displays:changed', displays))

  operatorWindow = createOperatorWindow()
  output.start()

  app.on('activate', () => {
    if (!operatorWindow) operatorWindow = createOperatorWindow()
  })
  app.on('before-quit', () => output.destroy())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => closeDatabase())
