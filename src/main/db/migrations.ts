import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  up: string
}

// Append new migrations at the end. Never edit one that has been released:
// databases on church laptops have already run it.
export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    up: `
      CREATE TABLE settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE themes (
        id         INTEGER PRIMARY KEY,
        name       TEXT NOT NULL,
        kind       TEXT NOT NULL CHECK (kind IN ('song', 'bible', 'text')),
        data       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE songs (
        id            INTEGER PRIMARY KEY,
        title         TEXT NOT NULL,
        author        TEXT,
        copyright     TEXT,
        ccli          TEXT,
        keywords      TEXT,
        display_order TEXT,
        theme_id      INTEGER REFERENCES themes (id) ON DELETE SET NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE song_sections (
        id       INTEGER PRIMARY KEY,
        song_id  INTEGER NOT NULL REFERENCES songs (id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        kind     TEXT NOT NULL CHECK (kind IN ('verse', 'pre-chorus', 'chorus', 'bridge', 'tag', 'ending', 'other')),
        number   INTEGER,
        text     TEXT NOT NULL,
        UNIQUE (song_id, position)
      );

      CREATE TABLE bible_versions (
        id           INTEGER PRIMARY KEY,
        name         TEXT NOT NULL,
        abbreviation TEXT NOT NULL UNIQUE,
        language     TEXT NOT NULL,
        license      TEXT
      );

      CREATE TABLE bible_verses (
        version_id INTEGER NOT NULL REFERENCES bible_versions (id) ON DELETE CASCADE,
        book       INTEGER NOT NULL CHECK (book BETWEEN 1 AND 66),
        chapter    INTEGER NOT NULL CHECK (chapter > 0),
        verse      INTEGER NOT NULL CHECK (verse > 0),
        text       TEXT NOT NULL,
        PRIMARY KEY (version_id, book, chapter, verse)
      ) WITHOUT ROWID;

      CREATE TABLE media (
        id          INTEGER PRIMARY KEY,
        kind        TEXT NOT NULL CHECK (kind IN ('image', 'video')),
        path        TEXT NOT NULL UNIQUE,
        duration_ms INTEGER,
        thumbnail   TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE recent_schedules (
        path      TEXT PRIMARY KEY,
        name      TEXT NOT NULL,
        opened_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `
  }
]

export const LATEST_VERSION = migrations.at(-1)?.version ?? 0

export interface MigrationResult {
  from: number
  to: number
}

// Runs every migration newer than the database's user_version, each in its
// own transaction, so a failure leaves the database at the last good version.
export function migrate(db: Database.Database, list: readonly Migration[] = migrations): MigrationResult {
  const from = db.pragma('user_version', { simple: true }) as number
  const latest = list.at(-1)?.version ?? 0

  if (from > latest) {
    throw new Error(
      `Database version ${from} is newer than this app supports (${latest}). Install the latest El-Gibbor Worship.`
    )
  }

  for (const migration of list) {
    if (migration.version <= from) continue
    db.transaction(() => {
      db.exec(migration.up)
      db.pragma(`user_version = ${migration.version}`)
    })()
  }

  return { from, to: Math.max(from, latest) }
}
