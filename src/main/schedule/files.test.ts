import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { withUid } from '@shared/schedule'
import { migrate } from '../db/migrations'
import { MAX_RECENT, readScheduleFile, RecentSchedules, writeScheduleFile } from './files'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'egw-schedule-'))
})

afterEach(() => rm(dir, { recursive: true, force: true }))

const items = [
  withUid({ kind: 'song', songId: 1, title: 'Bapa Engkau Sungguh Baik' }),
  withUid({ kind: 'text', title: 'Pengumuman', body: 'Doa malam' })
]

describe('schedule files', () => {
  it('writes a file that reads back the same and leaves no temp file', async () => {
    const path = join(dir, 'Minggu.egw')
    await writeScheduleFile(path, items)
    expect(await readdir(dir)).toEqual(['Minggu.egw'])
    const opened = await readScheduleFile(path)
    expect(opened.items.map((i) => i.title)).toEqual(['Bapa Engkau Sungguh Baik', 'Pengumuman'])
    expect(JSON.parse(await readFile(path, 'utf8')).format).toBe('el-gibbor-worship/schedule')
  })

  it('explains a missing or foreign file', async () => {
    await expect(readScheduleFile(join(dir, 'tidak-ada.egw'))).rejects.toThrow('tidak ditemukan')
    const other = join(dir, 'lain.egw')
    await writeFile(other, '<xml/>')
    await expect(readScheduleFile(other)).rejects.toThrow('rusak')
  })

  it('reports a folder that cannot be written', async () => {
    await expect(writeScheduleFile(join(dir, 'tidak', 'ada.egw'), items)).rejects.toThrow('tidak bisa disimpan')
  })
})

describe('RecentSchedules', () => {
  it('lists newest first, without duplicates, and marks missing files', async () => {
    const db = new Database(':memory:')
    migrate(db)
    const recent = new RecentSchedules(db)
    const a = join(dir, 'a.egw')
    await writeFile(a, '{}')
    recent.add(a)
    await new Promise((resolve) => setTimeout(resolve, 5))
    recent.add(join(dir, 'b.egw'))
    await new Promise((resolve) => setTimeout(resolve, 5))
    recent.add(a)
    const list = recent.list()
    expect(list.map((r) => r.name)).toEqual(['a', 'b'])
    expect(list.map((r) => r.exists)).toEqual([true, false])
    expect(recent.has(a)).toBe(true)
    recent.remove(a)
    expect(recent.has(a)).toBe(false)
    db.close()
  })

  it('keeps only the last few', () => {
    const recent = new RecentSchedules(null)
    for (let i = 0; i < MAX_RECENT + 5; i++) recent.add(join(dir, `${i}.egw`))
    const list = recent.list()
    expect(list).toHaveLength(MAX_RECENT)
    expect(list[0]!.name).toBe(String(MAX_RECENT + 4))
  })
})
