import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, type AppInfo } from '@shared/ipc'

// The only API the renderer can reach. Everything goes through typed IPC calls.
const api = {
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke(IpcChannel.getAppInfo)
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
