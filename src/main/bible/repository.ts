import type Database from 'better-sqlite3'
import type { BibleReference } from '@shared/bible/reference'
import type { BibleVerse } from '@shared/bible/slides'
import { cleanAbbreviation, type ImportedBible } from './importers'

export interface BibleVersion {
  id: number
  name: string
  abbreviation: string
  language: string
  license: string
  verseCount: number
}

// Stops a typo such as "mzm 1-150" from loading the whole book at once.
export const MAX_PASSAGE_VERSES = 200

export class BibleRepository {
  constructor(private readonly db: Database.Database) {}

  listVersions(): BibleVersion[] {
    return this.db
      .prepare(
        `SELECT v.id, v.name, v.abbreviation, v.language, COALESCE(v.license, '') AS license,
                (SELECT COUNT(*) FROM bible_verses b WHERE b.version_id = v.id) AS verseCount
         FROM bible_versions v ORDER BY v.name COLLATE NOCASE`
      )
      .all() as BibleVersion[]
  }

  getVersion(id: number): BibleVersion | null {
    return this.listVersions().find((v) => v.id === id) ?? null
  }

  // Saves an imported Bible as a new version. If the abbreviation is taken
  // ("TB" twice), the new one becomes "TB2", "TB3", and so on.
  importVersion(bible: ImportedBible): BibleVersion {
    const id = this.db.transaction(() => {
      const abbreviation = this.uniqueAbbreviation(bible.abbreviation)
      const result = this.db
        .prepare('INSERT INTO bible_versions (name, abbreviation, language, license) VALUES (?, ?, ?, ?)')
        .run(bible.name.slice(0, 200), abbreviation, bible.language || 'id', bible.license || null)
      const versionId = Number(result.lastInsertRowid)
      // OR REPLACE: a few files repeat a verse; the last copy wins.
      const insert = this.db.prepare(
        'INSERT OR REPLACE INTO bible_verses (version_id, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)'
      )
      for (const v of bible.verses) insert.run(versionId, v.book, v.chapter, v.verse, v.text)
      return versionId
    })()
    return this.getVersion(id)!
  }

  renameVersion(id: number, name: string, abbreviation: string): BibleVersion {
    const cleanName = name.trim().slice(0, 200)
    const cleanAbbr = cleanAbbreviation(abbreviation)
    if (!cleanName) throw new Error('Nama terjemahan wajib diisi.')
    if (!cleanAbbr) throw new Error('Singkatan wajib diisi (huruf atau angka).')
    const taken = this.db
      .prepare('SELECT id FROM bible_versions WHERE abbreviation = ? COLLATE NOCASE AND id != ?')
      .get(cleanAbbr, id)
    if (taken) throw new Error(`Singkatan ${cleanAbbr} sudah dipakai terjemahan lain.`)
    const result = this.db
      .prepare('UPDATE bible_versions SET name = ?, abbreviation = ? WHERE id = ?')
      .run(cleanName, cleanAbbr, id)
    if (result.changes === 0) throw new Error('Terjemahan tidak ditemukan.')
    return this.getVersion(id)!
  }

  deleteVersion(id: number): void {
    this.db.prepare('DELETE FROM bible_versions WHERE id = ?').run(id)
  }

  getPassage(versionId: number, reference: BibleReference): BibleVerse[] {
    const query = this.db.prepare(
      `SELECT book, chapter, verse, text FROM bible_verses
       WHERE version_id = ? AND book = ? AND (chapter, verse) BETWEEN (?, ?) AND (?, ?)
       ORDER BY chapter, verse LIMIT ?`
    )
    const verses: BibleVerse[] = []
    const seen = new Set<string>()
    for (const range of reference.ranges) {
      const rows = query.all(
        versionId,
        reference.book,
        range.startChapter,
        range.startVerse ?? 1,
        range.endChapter,
        range.endVerse ?? 999,
        MAX_PASSAGE_VERSES + 1
      ) as BibleVerse[]
      for (const row of rows) {
        const key = `${row.chapter}:${row.verse}`
        if (!seen.has(key)) {
          seen.add(key)
          verses.push(row)
        }
      }
      if (verses.length > MAX_PASSAGE_VERSES) {
        throw new Error(
          `Bagian terlalu panjang (lebih dari ${MAX_PASSAGE_VERSES} ayat). Pilih bagian yang lebih pendek.`
        )
      }
    }
    return verses
  }

  private uniqueAbbreviation(base: string): string {
    const root = cleanAbbreviation(base).slice(0, 10) || 'ALKITAB'
    const exists = this.db.prepare('SELECT 1 FROM bible_versions WHERE abbreviation = ? COLLATE NOCASE')
    if (!exists.get(root)) return root
    for (let n = 2; ; n++) {
      if (!exists.get(`${root}${n}`)) return `${root}${n}`
    }
  }
}
