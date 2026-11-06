import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseReference, type BibleReference } from '@shared/bible/reference'
import { migrate } from '../db/migrations'
import { readBibleFile, type ImportedBible } from './importers'
import { BibleRepository, MAX_PASSAGE_VERSES } from './repository'

let db: Database.Database
let bible: BibleRepository
let kjv: ImportedBible

const ref = (text: string): BibleReference => {
  const result = parseReference(text)
  if (!result.ok) throw new Error(result.error)
  return result.reference
}

beforeEach(async () => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  migrate(db)
  bible = new BibleRepository(db)
  kjv = await readBibleFile(join(__dirname, '../../../tests/fixtures/bible/kjv-zefania.xml'))
})

afterEach(() => db.close())

describe('BibleRepository', () => {
  it('imports a version and counts its verses', () => {
    const version = bible.importVersion(kjv)
    expect(version).toMatchObject({ name: 'King James Version', abbreviation: 'KJV', verseCount: 7 })
    expect(bible.listVersions()).toHaveLength(1)
  })

  it('gives a second copy a unique abbreviation', () => {
    bible.importVersion(kjv)
    expect(bible.importVersion(kjv).abbreviation).toBe('KJV2')
  })

  it('returns a verse range in order', () => {
    const { id } = bible.importVersion(kjv)
    expect(bible.getPassage(id, ref('yoh 3:16-17')).map((v) => v.verse)).toEqual([16, 17])
  })

  it('returns a whole chapter and a verse list without duplicates', () => {
    const { id } = bible.importVersion(kjv)
    expect(bible.getPassage(id, ref('kej 1')).map((v) => v.verse)).toEqual([1, 2, 3])
    expect(bible.getPassage(id, ref('kej 1:1-2, 2, 3')).map((v) => v.verse)).toEqual([1, 2, 3])
  })

  it('returns nothing for verses the file does not have', () => {
    const { id } = bible.importVersion(kjv)
    expect(bible.getPassage(id, ref('wahyu 22:21'))).toEqual([])
  })

  it('refuses very long passages', () => {
    const many: ImportedBible = {
      ...kjv,
      verses: Array.from({ length: MAX_PASSAGE_VERSES + 5 }, (_, i) => ({
        book: 19,
        chapter: 119,
        verse: i + 1,
        text: 'x'
      }))
    }
    const { id } = bible.importVersion(many)
    expect(() => bible.getPassage(id, ref('mzm 119'))).toThrow('terlalu panjang')
  })

  it('renames a version and rejects a duplicate abbreviation', () => {
    const first = bible.importVersion(kjv)
    const second = bible.importVersion(kjv)
    expect(bible.renameVersion(first.id, 'Terjemahan Baru', 'tb')).toMatchObject({
      name: 'Terjemahan Baru',
      abbreviation: 'TB'
    })
    expect(() => bible.renameVersion(second.id, 'Lain', 'TB')).toThrow('sudah dipakai')
    expect(() => bible.renameVersion(second.id, ' ', 'X')).toThrow('Nama terjemahan wajib')
  })

  it('deletes a version with all its verses', () => {
    const { id } = bible.importVersion(kjv)
    bible.deleteVersion(id)
    expect(bible.listVersions()).toEqual([])
    expect(db.prepare('SELECT COUNT(*) AS n FROM bible_verses').get()).toEqual({ n: 0 })
  })

  it('imports a full-size Bible quickly', () => {
    const big: ImportedBible = {
      ...kjv,
      verses: Array.from({ length: 31_102 }, (_, i) => ({
        book: (i % 66) + 1,
        chapter: Math.floor(i / 66 / 30) + 1,
        verse: (Math.floor(i / 66) % 30) + 1,
        text: 'Pada mulanya Allah menciptakan langit dan bumi.'
      }))
    }
    const start = performance.now()
    const version = bible.importVersion(big)
    expect(version.verseCount).toBe(31_102)
    expect(performance.now() - start).toBeLessThan(5000)
  })
})
