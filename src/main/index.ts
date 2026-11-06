import { join } from 'node:path'
import { app, BrowserWindow, nativeTheme, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import type { DatabaseStatus } from '@shared/ipc'
import type { AppSettings } from '@shared/settings'
import { formatVersionLabel } from '@shared/version'
import { closeDatabase, getDatabase, openDatabase } from './db'
import { listDisplays, watchDisplays } from './displays'
import { broadcast, registerHandlers } from './ipc'
import { SettingsStore } from './settings/store'

let databaseStatus: DatabaseStatus = { ok: false, error: 'Database not opened yet' }

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
      preload: join(__dirname, '../preload/index.js'),
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/operator/index.html`)
  } else {
    void window.loadFile(join(__dirname, '../renderer/operator/index.html'))
  }

  return window
}

function registerIpc(settings: SettingsStore): void {
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
    'displays:list': () => listDisplays()
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('org.elgibbor.worship')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  databaseStatus = openDatabase(app.getPath('userData'))
  const settings = new SettingsStore(getDatabase())
  applyNativeTheme(settings.get())
  settings.onChange((next) => {
    applyNativeTheme(next)
    broadcast('settings:changed', next)
  })

  registerIpc(settings)
  watchDisplays((displays) => broadcast('displays:changed', displays))

  createOperatorWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createOperatorWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => closeDatabase())
