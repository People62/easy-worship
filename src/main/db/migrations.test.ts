import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LATEST_VERSION, migrate, type Migration } from './migrations'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
})

afterEach(() => db.close())

const tableNames = (): string[] =>
  (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]).map(
    (row) => row.name
  )

describe('migrate', () => {
  it('creates the full schema on a new database', () => {
    expect(migrate(db)).toEqual({ from: 0, to: LATEST_VERSION })
    expect(tableNames()).toEqual([
      'bible_verses',
      'bible_versions',
      'media',
      'recent_schedules',
      'settings',
      'song_sections',
      'songs',
      'songs_fts',
      'songs_fts_config',
      'songs_fts_content',
      'songs_fts_data',
      'songs_fts_docsize',
      'songs_fts_idx',
      'themes'
    ])
    expect(db.pragma('user_version', { simple: true })).toBe(LATEST_VERSION)
  })

  it('does nothing the second time', () => {
    migrate(db)
    expect(migrate(db)).toEqual({ from: LATEST_VERSION, to: LATEST_VERSION })
  })

  it('refuses a database from a newer app version', () => {
    db.pragma(`user_version = ${LATEST_VERSION + 1}`)
    expect(() => migrate(db)).toThrow('newer than this app supports')
  })

  it('rolls back a failing migration and keeps the previous version', () => {
    const list: Migration[] = [
      { version: 1, name: 'ok', up: 'CREATE TABLE a (id INTEGER);' },
      { version: 2, name: 'broken', up: 'CREATE TABLE b (id INTEGER); SELECT * FROM missing_table;' }
    ]
    expect(() => migrate(db, list)).toThrow()
    expect(db.pragma('user_version', { simple: true })).toBe(1)
    expect(tableNames()).toEqual(['a'])
  })

  it('deletes song sections together with their song', () => {
    migrate(db)
    const songId = db.prepare("INSERT INTO songs (title) VALUES ('Bapa Engkau Sungguh Baik')").run().lastInsertRowid
    db.prepare("INSERT INTO song_sections (song_id, position, kind, number, text) VALUES (?, 1, 'verse', 1, 'a')").run(
      songId
    )
    db.prepare('DELETE FROM songs WHERE id = ?').run(songId)
    expect(db.prepare('SELECT COUNT(*) AS n FROM song_sections').get()).toEqual({ n: 0 })
  })

  it('rejects an unknown section kind', () => {
    migrate(db)
    const songId = db.prepare("INSERT INTO songs (title) VALUES ('x')").run().lastInsertRowid
    expect(() =>
      db.prepare("INSERT INTO song_sections (song_id, position, kind, text) VALUES (?, 1, 'refrain', 'a')").run(songId)
    ).toThrow(/CHECK constraint/)
  })
})
