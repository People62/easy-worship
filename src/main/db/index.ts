import { join } from 'node:path'
import Database from 'better-sqlite3'
import type { DatabaseStatus } from '@shared/ipc'
import { migrate } from './migrations'

export const DATABASE_FILE = 'el-gibbor-worship.sqlite'

let db: Database.Database | null = null

// Opens the app database in the user data folder (%APPDATA% on Windows),
// so reinstalling or updating the app never touches user data.
export function openDatabase(userDataDir: string): DatabaseStatus {
  try {
    db = new Database(join(userDataDir, DATABASE_FILE))
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    const { to } = migrate(db)
    const row = db.prepare('SELECT sqlite_version() AS version').get() as { version: string }
    return { ok: true, sqliteVersion: row.version, schemaVersion: to }
  } catch (error) {
    db?.close()
    db = null
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function getDatabase(): Database.Database | null {
  return db
}

export function closeDatabase(): void {
  db?.close()
  db = null
}
