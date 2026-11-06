import { existsSync } from 'node:fs'
import { readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import type Database from 'better-sqlite3'
import type { RecentSchedule } from '@shared/ipc'
import {
  MAX_SCHEDULE_FILE_BYTES,
  parseScheduleFile,
  scheduleNameFromPath,
  serializeSchedule,
  type ParsedSchedule,
  type ScheduleItem
} from '@shared/schedule'
import { t } from '@shared/i18n'

export const MAX_RECENT = 10

export async function readScheduleFile(path: string): Promise<ParsedSchedule> {
  const info = await stat(path).catch(() => null)
  if (!info?.isFile()) throw new Error(t('File schedule tidak ditemukan. Mungkin sudah dipindah atau dihapus.'))
  if (info.size > MAX_SCHEDULE_FILE_BYTES) throw new Error(t('File terlalu besar untuk sebuah schedule.'))
  return parseScheduleFile(await readFile(path, 'utf8'))
}

// Writes to a temporary file first and then swaps it in, so a power cut in
// the middle of saving never leaves a half-written schedule behind.
export async function writeScheduleFile(path: string, items: ScheduleItem[]): Promise<void> {
  const temp = `${path}.${process.pid}.tmp`
  try {
    await writeFile(temp, serializeSchedule(items), 'utf8')
    await rename(temp, path)
  } catch (error) {
    await rm(temp, { force: true })
    throw new Error(t('Schedule tidak bisa disimpan. Periksa apakah folder bisa ditulisi.'), { cause: error })
  }
}

// The schedules opened or saved lately, newest first. Without a database it
// keeps the list in memory for this session.
export class RecentSchedules {
  private readonly memory = new Map<string, string>()

  constructor(private readonly db: Database.Database | null) {}

  add(path: string): void {
    const name = scheduleNameFromPath(path)
    const now = new Date().toISOString()
    if (!this.db) {
      this.memory.delete(path)
      this.memory.set(path, now)
      return
    }
    this.db
      .prepare(
        `INSERT INTO recent_schedules (path, name, opened_at) VALUES (?, ?, ?)
         ON CONFLICT(path) DO UPDATE SET name = excluded.name, opened_at = excluded.opened_at`
      )
      .run(path, name, now)
    // Keep the table small.
    this.db
      .prepare(
        `DELETE FROM recent_schedules WHERE path NOT IN
         (SELECT path FROM recent_schedules ORDER BY opened_at DESC LIMIT ?)`
      )
      .run(MAX_RECENT)
  }

  remove(path: string): void {
    this.memory.delete(path)
    this.db?.prepare('DELETE FROM recent_schedules WHERE path = ?').run(path)
  }

  has(path: string): boolean {
    return this.list().some((recent) => recent.path === path)
  }

  list(): RecentSchedule[] {
    const rows: { path: string; name: string; openedAt: string }[] = this.db
      ? (this.db
          .prepare('SELECT path, name, opened_at AS openedAt FROM recent_schedules ORDER BY opened_at DESC LIMIT ?')
          .all(MAX_RECENT) as { path: string; name: string; openedAt: string }[])
      : [...this.memory]
          .reverse()
          .slice(0, MAX_RECENT)
          .map(([path, openedAt]) => ({ path, name: scheduleNameFromPath(path), openedAt }))
    return rows.map((row) => ({ ...row, exists: existsSync(row.path) }))
  }
}
