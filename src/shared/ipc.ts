// IPC channel names and payload types shared by main, preload, and renderer.

export const IpcChannel = {
  getAppInfo: 'app:get-info'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: string
  electron: string
  database: DatabaseStatus
}

export type DatabaseStatus = { ok: true; sqliteVersion: string } | { ok: false; error: string }
