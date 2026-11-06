import type { BibleVerse } from './bible/slides'
import type { LiveDeck, LiveState, Overlay, Slide } from './live'
import type { OutputStatus } from './output'
import type { ScheduleItem } from './schedule'
import type { AppSettings, SettingsPatch } from './settings'
import type { Song, SongInput, SongSummary } from './songs'
import type { MediaRef, Theme, ThemeInput } from './theme'

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
  // "Yohanes 3:16-18", readable again by parseReference.
  reference: string
  // "Yohanes 3:16-18 (TB)"
  title: string
  verses: BibleVerse[]
}

export interface BibleImportResult {
  version: BibleVersionInfo
  skippedBooks: number
}

export interface MediaItem extends MediaRef {
  name: string
  width: number | null
  height: number | null
  durationMs: number | null
  sizeBytes: number
}

export interface MediaInfo {
  width: number
  height: number
  durationMs: number | null
  // "data:image/jpeg;base64,…", made by the renderer from the image or video.
  thumbnail: string
}

export interface MediaImportResult {
  imported: MediaItem[]
  failed: { file: string; error: string }[]
}

export interface OpenedSchedule {
  path: string
  name: string
  items: ScheduleItem[]
  // Damaged items left out while opening.
  skipped: number
}

export interface SavedSchedule {
  path: string
  name: string
}

export interface RecentSchedule {
  path: string
  name: string
  openedAt: string
  exists: boolean
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
  'live:show-deck': { args: [deck: LiveDeck, index: number]; result: LiveState }
  'live:go-to': { args: [index: number]; result: LiveState }
  'live:step': { args: [delta: number]; result: LiveState }
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
  'media:list': { args: []; result: MediaItem[] }
  // Opens a file picker (several files allowed); resolves with null if cancelled.
  'media:import': { args: []; result: MediaImportResult | null }
  'media:set-info': { args: [id: number, info: MediaInfo]; result: MediaItem }
  'media:rename': { args: [id: number, name: string]; result: MediaItem }
  'media:delete': { args: [id: number]; result: void }
  'themes:list': { args: []; result: Theme[] }
  'themes:create': { args: [input: ThemeInput]; result: Theme }
  'themes:update': { args: [id: number, input: ThemeInput]; result: Theme }
  'themes:delete': { args: [id: number]; result: void }
  'schedule:open': { args: []; result: OpenedSchedule | null }
  'schedule:open-recent': { args: [path: string]; result: OpenedSchedule }
  'schedule:save': { args: [items: ScheduleItem[], path: string | null]; result: SavedSchedule | null }
  'schedule:list-recent': { args: []; result: RecentSchedule[] }
}

// Push events: main -> renderer.
export interface EventContract {
  'settings:changed': AppSettings
  'displays:changed': DisplayInfo[]
  'live:changed': LiveState
  'schedule:recent-changed': RecentSchedule[]
  'output:status-changed': OutputStatus
  // A song was created, changed, or deleted (its id), so lists can refresh.
  'songs:changed': number
  'bible:versions-changed': BibleVersionInfo[]
  'media:changed': MediaItem[]
  // Also sent when media changes, because theme backgrounds point at media.
  'themes:changed': Theme[]
}

export type InvokeChannel = keyof InvokeContract
export type EventChannel = keyof EventContract
