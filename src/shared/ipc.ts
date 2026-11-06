import type { BibleVerse } from './bible/slides'
import type { LiveState, Overlay, Slide } from './live'
import type { OutputStatus } from './output'
import type { AppSettings, SettingsPatch } from './settings'
import type { Song, SongInput, SongSummary } from './songs'

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

export interface BibleVersionInfo {
  id: number
  name: string
  abbreviation: string
  language: string
  license: string
  verseCount: number
}

export interface BiblePassage {
  versionId: number
  abbreviation: string
  // "Yohanes 3:16-18 (TB)"
  title: string
  verses: BibleVerse[]
}

export interface BibleImportResult {
  version: BibleVersionInfo
  skippedBooks: number
}

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
  'songs:search': { args: [query: string]; result: SongSummary[] }
  'songs:get': { args: [id: number]; result: Song | null }
  'songs:create': { args: [input: SongInput]; result: Song }
  'songs:update': { args: [id: number, input: SongInput]; result: Song }
  'songs:delete': { args: [id: number]; result: void }
  'bible:list-versions': { args: []; result: BibleVersionInfo[] }
  // Opens a file picker; resolves with null if cancelled.
  'bible:import': { args: []; result: BibleImportResult | null }
  'bible:rename-version': { args: [id: number, name: string, abbreviation: string]; result: BibleVersionInfo }
  'bible:delete-version': { args: [id: number]; result: void }
  // Parses the typed reference in main, so the same rules apply everywhere.
  'bible:get-passage': { args: [versionId: number, query: string]; result: BiblePassage }
}

// Push events: main -> renderer.
export interface EventContract {
  'settings:changed': AppSettings
  'displays:changed': DisplayInfo[]
  'live:changed': LiveState
  'output:status-changed': OutputStatus
  // A song was created, changed, or deleted (its id), so lists can refresh.
  'songs:changed': number
  'bible:versions-changed': BibleVersionInfo[]
}

export type InvokeChannel = keyof InvokeContract
export type EventChannel = keyof EventContract
