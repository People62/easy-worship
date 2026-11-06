import { join } from 'node:path'
import { app, BrowserWindow, dialog, Menu, nativeTheme, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import type { DatabaseStatus } from '@shared/ipc'
import { formatReference, parseReference } from '@shared/bible/reference'
import { validateSongInput } from '@shared/songs'
import { validateThemeInput } from '@shared/theme'
import type { AppSettings } from '@shared/settings'
import { formatVersionLabel } from '@shared/version'
import { readBibleFile } from './bible/importers'
import { BibleRepository } from './bible/repository'
import { importLogo, LOGO_EXTENSIONS, logoUrl, removeLogos } from './church/logo'
import { closeDatabase, getDatabase, openDatabase } from './db'
import { listDisplays, watchDisplays } from './displays'
import { broadcast, registerHandlers } from './ipc'
import { LiveStore } from './live/store'
import { IMAGE_EXTENSIONS, MediaLibrary, VIDEO_EXTENSIONS } from './media/library'
import { OutputManager } from './output/manager'
import { handleEgwProtocol, registerEgwScheme } from './protocol'
import { SettingsStore } from './settings/store'
import { SongRepository } from './songs/repository'
import { ThemeRepository } from './themes/repository'

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
  const bibleRepository = db ? new BibleRepository(db) : null
  const bible = (): BibleRepository => {
    if (!bibleRepository)
      throw new Error('Database tidak bisa dibuka, jadi Alkitab tidak tersedia. Lihat Pengaturan → Tentang.')
    return bibleRepository
  }
  const versionId = (id: unknown): number => {
    if (!Number.isInteger(id) || (id as number) < 1) throw new Error('Terjemahan tidak valid.')
    return id as number
  }
  const versionsChanged = (): void => broadcast('bible:versions-changed', bible().listVersions())

  const mediaLibrary = db ? new MediaLibrary(db, userData) : null
  const themeRepository = db ? new ThemeRepository(db, (id) => mediaLibrary?.get(id) ?? null) : null
  const media = (): MediaLibrary => {
    if (!mediaLibrary) throw new Error('Database tidak bisa dibuka, jadi media tidak tersedia.')
    return mediaLibrary
  }
  const themes = (): ThemeRepository => {
    if (!themeRepository) throw new Error('Database tidak bisa dibuka, jadi tema tidak tersedia.')
    return themeRepository
  }
  const recordId = (id: unknown, what: string): number => {
    if (!Number.isInteger(id) || (id as number) < 1) throw new Error(`${what} tidak valid.`)
    return id as number
  }
  const mediaChanged = (): void => {
    broadcast('media:changed', media().list())
    broadcast('themes:changed', themes().list())
  }
  const themesChanged = (): void => broadcast('themes:changed', themes().list())

  // Every kind of slide needs a theme. New databases get the built-in ones,
  // and they become the defaults.
  if (themeRepository) {
    const created = themeRepository.ensureDefaults()
    const current = settings.get().themes
    const patch: { song?: number; bible?: number; text?: number } = {}
    for (const kind of ['song', 'bible', 'text'] as const) {
      const chosen = current[kind]
      if (chosen === null || !themeRepository.get(chosen)) {
        const fallback = created[kind] ?? themeRepository.firstOfKind(kind)?.id
        if (fallback !== undefined) patch[kind] = fallback
      }
    }
    if (Object.keys(patch).length > 0) settings.update({ themes: patch })
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
    },
    'bible:list-versions': () => bible().listVersions(),
    'bible:import': async () => {
      const options = {
        title: 'Impor Alkitab',
        properties: ['openFile' as const],
        filters: [{ name: 'Alkitab (Zefania, OSIS, OpenSong)', extensions: ['xml', 'osis', 'zefania'] }]
      }
      const result = operatorWindow
        ? await dialog.showOpenDialog(operatorWindow, options)
        : await dialog.showOpenDialog(options)
      const file = result.filePaths[0]
      if (result.canceled || !file) return null
      const imported = await readBibleFile(file)
      const version = bible().importVersion(imported)
      if (settings.get().bible.versionId === null) settings.update({ bible: { versionId: version.id } })
      versionsChanged()
      return { version, skippedBooks: imported.skippedBooks }
    },
    'bible:rename-version': (id, name, abbreviation) => {
      if (typeof name !== 'string' || typeof abbreviation !== 'string') throw new Error('Nama tidak valid.')
      const version = bible().renameVersion(versionId(id), name, abbreviation)
      versionsChanged()
      return version
    },
    'bible:delete-version': (id) => {
      bible().deleteVersion(versionId(id))
      if (settings.get().bible.versionId === id) {
        settings.update({ bible: { versionId: bible().listVersions()[0]?.id ?? null } })
      }
      versionsChanged()
    },
    'media:list': () => media().list(),
    'media:import': async () => {
      const options = {
        title: 'Impor gambar atau video',
        properties: ['openFile' as const, 'multiSelections' as const],
        filters: [
          { name: 'Gambar dan video', extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS] },
          { name: 'Gambar', extensions: [...IMAGE_EXTENSIONS] },
          { name: 'Video', extensions: [...VIDEO_EXTENSIONS] }
        ]
      }
      const result = operatorWindow
        ? await dialog.showOpenDialog(operatorWindow, options)
        : await dialog.showOpenDialog(options)
      if (result.canceled || result.filePaths.length === 0) return null
      const imported = await media().importFiles(result.filePaths.slice(0, 100))
      mediaChanged()
      return imported
    },
    'media:set-info': async (id, info) => {
      const item = await media().setInfo(recordId(id, 'Media'), info)
      mediaChanged()
      return item
    },
    'media:rename': (id, name) => {
      if (typeof name !== 'string') throw new Error('Nama tidak valid.')
      const item = media().rename(recordId(id, 'Media'), name)
      mediaChanged()
      return item
    },
    'media:delete': async (id) => {
      await media().delete(recordId(id, 'Media'))
      mediaChanged()
    },
    'themes:list': () => themes().list(),
    'themes:create': (input) => {
      const theme = themes().create(validateThemeInput(input))
      themesChanged()
      return theme
    },
    'themes:update': (id, input) => {
      const theme = themes().update(recordId(id, 'Tema'), validateThemeInput(input))
      themesChanged()
      return theme
    },
    'themes:delete': (id) => {
      const themeId = recordId(id, 'Tema')
      const theme = themes().get(themeId)
      themes().delete(themeId)
      if (theme && settings.get().themes[theme.kind] === themeId) {
        settings.update({ themes: { [theme.kind]: themes().firstOfKind(theme.kind)?.id ?? null } })
      }
      themesChanged()
    },
    'bible:get-passage': (id, query) => {
      const version = bible().getVersion(versionId(id))
      if (!version) throw new Error('Terjemahan tidak ditemukan. Mungkin sudah dihapus.')
      const parsed = parseReference(typeof query === 'string' ? query.slice(0, 100) : '')
      if (!parsed.ok) throw new Error(parsed.error)
      const verses = bible().getPassage(version.id, parsed.reference)
      if (verses.length === 0) {
        throw new Error(`${formatReference(parsed.reference)} tidak ada di ${version.abbreviation}.`)
      }
      return {
        versionId: version.id,
        abbreviation: version.abbreviation,
        title: `${formatReference(parsed.reference)} (${version.abbreviation})`,
        verses
      }
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
