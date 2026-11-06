import type Database from 'better-sqlite3'
import { applySettingsPatch, normalizeSettings, type AppSettings, type SettingsPatch } from '@shared/settings'

const SETTINGS_KEY = 'app'

type Listener = (settings: AppSettings) => void

// Keeps the current settings in memory and persists every change to SQLite.
// Without a database (it failed to open) settings still work for the session.
export class SettingsStore {
  private current: AppSettings
  private readonly listeners = new Set<Listener>()

  constructor(private readonly db: Database.Database | null) {
    this.current = normalizeSettings(this.read())
  }

  get(): AppSettings {
    return structuredClone(this.current)
  }

  update(patch: SettingsPatch): AppSettings {
    const next = applySettingsPatch(this.current, patch)
    this.write(next)
    this.current = next
    for (const listener of this.listeners) listener(this.get())
    return this.get()
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private read(): unknown {
    if (!this.db) return undefined
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(SETTINGS_KEY) as
      { value: string } | undefined
    if (!row) return undefined
    try {
      return JSON.parse(row.value)
    } catch {
      return undefined
    }
  }

  private write(settings: AppSettings): void {
    this.db
      ?.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value'
      )
      .run(SETTINGS_KEY, JSON.stringify(settings))
  }
}
