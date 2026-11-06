import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '@shared/settings'
import { migrate } from '../db/migrations'
import { SettingsStore } from './store'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  migrate(db)
})

afterEach(() => db.close())

describe('SettingsStore', () => {
  it('starts with defaults on a new database', () => {
    expect(new SettingsStore(db).get()).toEqual(DEFAULT_SETTINGS)
  })

  it('remembers changes across restarts', () => {
    new SettingsStore(db).update({ appearance: { mode: 'light', primary: '#16a34a' } })
    const reopened = new SettingsStore(db)
    expect(reopened.get().appearance).toEqual({ mode: 'light', primary: '#16A34A' })
  })

  it('recovers from a damaged settings row', () => {
    db.prepare("INSERT INTO settings (key, value) VALUES ('app', '{not json')").run()
    expect(new SettingsStore(db).get()).toEqual(DEFAULT_SETTINGS)
  })

  it('notifies listeners and supports unsubscribing', () => {
    const store = new SettingsStore(db)
    const listener = vi.fn()
    const unsubscribe = store.onChange(listener)
    store.update({ appearance: { mode: 'system' } })
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ appearance: expect.objectContaining({ mode: 'system' }) })
    )
    unsubscribe()
    store.update({ appearance: { mode: 'dark' } })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('keeps the old value when a patch is invalid', () => {
    const store = new SettingsStore(db)
    expect(() => store.update({ appearance: { primary: 'red' } })).toThrow()
    expect(store.get()).toEqual(DEFAULT_SETTINGS)
  })

  it('works in memory when there is no database', () => {
    const store = new SettingsStore(null)
    store.update({ output: { displayId: 2 } })
    expect(store.get().output.displayId).toBe(2)
  })

  it('returns copies so callers cannot change the stored value', () => {
    const store = new SettingsStore(db)
    store.get().appearance.mode = 'light'
    expect(store.get().appearance.mode).toBe('dark')
  })
})
