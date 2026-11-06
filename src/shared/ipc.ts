import type { AppSettings, SettingsPatch } from './settings'

// The single list of IPC calls between the windows and the main process.
// Main must register a handler for every entry (checked by TypeScript in
// main/ipc), and preload exposes them to the renderer as window.api.

export interface AppInfo {
  name: string
  version: string
  platform: string
  electron: string
  database: DatabaseStatus
}

export type DatabaseStatus = { ok: true; sqliteVersion: string; schemaVersion: number } | { ok: false; error: string }

export interface DisplayInfo {
  id: number
  label: string
  width: number
  height: number
  isPrimary: boolean
}

// Request/response calls: renderer -> main.
export interface InvokeContract {
  'app:get-info': { args: []; result: AppInfo }
  'settings:get': { args: []; result: AppSettings }
  'settings:update': { args: [patch: SettingsPatch]; result: AppSettings }
  'displays:list': { args: []; result: DisplayInfo[] }
}

// Push events: main -> renderer.
export interface EventContract {
  'settings:changed': AppSettings
  'displays:changed': DisplayInfo[]
}

export type InvokeChannel = keyof InvokeContract
export type EventChannel = keyof EventContract
