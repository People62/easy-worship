import type { LiveState, Overlay, Slide } from './live'
import type { OutputStatus } from './output'
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
  'live:get': { args: []; result: LiveState }
  'live:show': { args: [slide: Slide | null]; result: LiveState }
  'live:toggle-overlay': { args: [overlay: Exclude<Overlay, 'none'>]; result: LiveState }
  'live:clear-overlay': { args: []; result: LiveState }
  'output:get-status': { args: []; result: OutputStatus }
  // Opens a file picker; resolves with the new settings, or null if cancelled.
  'church:choose-logo': { args: []; result: AppSettings | null }
  'church:remove-logo': { args: []; result: AppSettings }
}

// Push events: main -> renderer.
export interface EventContract {
  'settings:changed': AppSettings
  'displays:changed': DisplayInfo[]
  'live:changed': LiveState
  'output:status-changed': OutputStatus
}

export type InvokeChannel = keyof InvokeContract
export type EventChannel = keyof EventContract
