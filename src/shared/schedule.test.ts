import { describe, expect, it } from 'vitest'
import { formatReference, parseReference } from './bible/reference'
import {
  duplicateItem,
  insertItem,
  MAX_SCHEDULE_ITEMS,
  moveItem,
  parseScheduleFile,
  removeItem,
  scheduleNameFromPath,
  serializeSchedule,
  textSlides,
  validateScheduleItems,
  withoutUid,
  withUid,
  type ScheduleItem
} from './schedule'

const song = withUid({ kind: 'song', songId: 1, title: 'Bapa Engkau Sungguh Baik' })
const verse = withUid({
  kind: 'bible',
  versionId: 2,
  abbreviation: 'TB',
  reference: 'Yohanes 3:16',
  title: 'Yohanes 3:16 (TB)'
})
const picture = withUid({ kind: 'media', mediaId: 3, title: 'Salib' })
const notice = withUid({ kind: 'text', title: 'Pengumuman', body: 'Doa malam\nRabu 19.00\n\nPersekutuan pemuda' })
const items: ScheduleItem[] = [song, verse, picture, notice]
const uids = (list: ScheduleItem[]): string[] => list.map((i) => i.uid)

describe('schedule list edits', () => {
  it('moves an item to where it is dropped', () => {
    expect(uids(moveItem(items, 0, 2))).toEqual(uids([verse, song, picture, notice]))
    expect(uids(moveItem(items, 3, 0))).toEqual(uids([notice, song, verse, picture]))
    expect(uids(moveItem(items, 1, 4))).toEqual(uids([song, picture, notice, verse]))
  })

  it('leaves the list alone when dropped on itself', () => {
    expect(moveItem(items, 1, 1)).toBe(items)
    expect(moveItem(items, 1, 2)).toBe(items)
    expect(moveItem(items, 9, 0)).toBe(items)
  })

  it('inserts, removes, and duplicates', () => {
    const extra = withUid({ kind: 'song', songId: 9, title: 'Lagu baru' })
    expect(insertItem(items, extra, 1)[1]).toBe(extra)
    expect(insertItem(items, extra, 99).at(-1)).toBe(extra)
    expect(uids(removeItem(items, 2))).toEqual(uids([song, verse, notice]))
    const copied = duplicateItem(items, 0)
    expect(copied).toHaveLength(5)
    expect(copied[1]).toMatchObject({ kind: 'song', songId: 1 })
    expect(copied[1]!.uid).not.toBe(song.uid)
  })

  it('never changes the original list', () => {
    const before = uids(items)
    moveItem(items, 0, 3)
    removeItem(items, 0)
    duplicateItem(items, 0)
    expect(uids(items)).toEqual(before)
  })
})

describe('textSlides', () => {
  it('starts a new slide at a blank line and labels the parts', () => {
    const slides = textSlides(notice as ScheduleItem & { kind: 'text' })
    expect(slides.map((s) => s.text)).toEqual(['Doa malam\nRabu 19.00', 'Persekutuan pemuda'])
    expect(slides.map((s) => s.label)).toEqual(['Pengumuman (1/2)', 'Pengumuman (2/2)'])
  })

  it('has no slides for an empty announcement', () => {
    expect(textSlides({ uid: 'x', title: 'Kosong', body: ' \n\n ' })).toEqual([])
  })
})

describe('.egw files', () => {
  it('survives a save and open round trip', () => {
    const { items: opened, skipped } = parseScheduleFile(serializeSchedule(items))
    expect(skipped).toBe(0)
    expect(opened.map(withoutUid)).toEqual(items.map(withoutUid))
  })

  it('does not store the in-memory ids', () => {
    expect(serializeSchedule(items)).not.toContain(song.uid)
  })

  it('skips damaged items but keeps the rest', () => {
    const file = JSON.stringify({
      format: 'el-gibbor-worship/schedule',
      version: 1,
      items: [{ kind: 'song', songId: 1, title: 'Ok' }, { kind: 'song', songId: 'x', title: 'Rusak' }, { kind: 'film' }]
    })
    const parsed = parseScheduleFile(file)
    expect(parsed.items).toHaveLength(1)
    expect(parsed.skipped).toBe(2)
  })

  it('rejects files that are not schedules', () => {
    expect(() => parseScheduleFile('{oops')).toThrow('rusak')
    expect(() => parseScheduleFile('{"items": []}')).toThrow('bukan schedule')
    expect(() =>
      parseScheduleFile(JSON.stringify({ format: 'el-gibbor-worship/schedule', version: 9, items: [] }))
    ).toThrow('lebih baru')
  })

  it('reads a file saved with a BOM', () => {
    expect(parseScheduleFile('\uFEFF' + serializeSchedule([song])).items).toHaveLength(1)
  })

  it('names a schedule after its file', () => {
    expect(scheduleNameFromPath('C:\\Ibadah\\Minggu 12 Mei.egw')).toBe('Minggu 12 Mei')
    expect(scheduleNameFromPath('/home/op/raya.EGW')).toBe('raya')
  })

  it('stores Bible references that can be read back', () => {
    for (const input of ['yoh 3:16-18', 'mzm 23', '1 kor 13:4-7', 'kej 1:31-2:3', 'yoh 3:16, 18']) {
      const parsed = parseReference(input)
      if (!parsed.ok) throw new Error(input)
      const stored = formatReference(parsed.reference)
      const again = parseReference(stored)
      expect(again.ok && formatReference(again.reference)).toBe(stored)
    }
  })
})

describe('validateScheduleItems', () => {
  it('keeps ids and rejects bad items with their position', () => {
    expect(validateScheduleItems(items).map((i) => i.uid)).toEqual(uids(items))
    expect(() => validateScheduleItems([song, { kind: 'song' }])).toThrow('ke-2')
    expect(() => validateScheduleItems('x')).toThrow()
    expect(() => validateScheduleItems(Array(MAX_SCHEDULE_ITEMS + 1).fill(song))).toThrow('maksimal')
  })
})
