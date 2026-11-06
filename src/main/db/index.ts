import { join } from 'node:path'
import Database from 'better-sqlite3'
import type { DatabaseStatus } from '@shared/ipc'

let db: Database.Database | null = null

// Opens the app database in the user data folder (%APPDATA% on Windows),
// so reinstalling or updating the app never touches user data.
export function openDatabase(userDataDir: string): DatabaseStatus {
  try {
    db = new Database(join(userDataDir, 'el-gibbor-worship.sqlite'))
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    const row = db.prepare('SELECT sqlite_version() AS version').get() as { version: string }
    return { ok: true, sqliteVersion: row.version }
  } catch (error) {
    db = null
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function closeDatabase(): void {
  db?.close()
  db = null
}
