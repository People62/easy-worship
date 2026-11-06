import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { IpcChannel, type AppInfo, type DatabaseStatus } from '@shared/ipc'
import { formatVersionLabel } from '@shared/version'
import { closeDatabase, openDatabase } from './db'

let databaseStatus: DatabaseStatus = { ok: false, error: 'Database not opened yet' }

function createOperatorWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#171412',
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId('org.elgibbor.worship')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  databaseStatus = openDatabase(app.getPath('userData'))

  ipcMain.handle(IpcChannel.getAppInfo, (): AppInfo => ({
    name: app.getName(),
    version: formatVersionLabel(app.getVersion(), app.isPackaged),
    platform: process.platform,
    electron: process.versions.electron,
    database: databaseStatus
  }))

  createOperatorWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createOperatorWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => closeDatabase())
