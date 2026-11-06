import type Database from 'better-sqlite3'
import { songFirstLine, type SectionKind, type Song, type SongInput, type SongSummary } from '@shared/songs'

const LIST_LIMIT = 200

interface SongRow {
  id: number
  title: string
  author: string | null
  copyright: string | null
  ccli: string | null
  keywords: string | null
  created_at: string
  updated_at: string
}

interface SectionRow {
  kind: SectionKind
  number: number | null
  text: string
}

// Builds an FTS5 query where every word must match as a prefix:
// "bapa baik" → "bapa"* AND "baik"*. Quotes stop operators like OR or NEAR
// typed by the operator from being treated as FTS syntax.
export function buildSearchQuery(input: string): string | null {
  const words = input
    .normalize('NFKC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 10)
  if (words.length === 0) return null
  return words.map((word) => `"${word}"*`).join(' ')
}

export class SongRepository {
  constructor(private readonly db: Database.Database) {}

  count(): number {
    return (this.db.prepare('SELECT COUNT(*) AS n FROM songs').get() as { n: number }).n
  }

  get(id: number): Song | null {
    const row = this.db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as SongRow | undefined
    if (!row) return null
    const sections = this.db
      .prepare('SELECT kind, number, text FROM song_sections WHERE song_id = ? ORDER BY position')
      .all(id) as SectionRow[]
    return {
      id: row.id,
      title: row.title,
      author: row.author ?? '',
      copyright: row.copyright ?? '',
      ccli: row.ccli ?? '',
      keywords: row.keywords ?? '',
      sections,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  create(input: SongInput): Song {
    const id = this.db.transaction(() => {
      const result = this.db
        .prepare('INSERT INTO songs (title, author, copyright, ccli, keywords) VALUES (?, ?, ?, ?, ?)')
        .run(input.title, input.author, input.copyright, input.ccli, input.keywords)
      const songId = Number(result.lastInsertRowid)
      this.writeSections(songId, input)
      return songId
    })()
    return this.get(id)!
  }

  update(id: number, input: SongInput): Song {
    this.db.transaction(() => {
      const result = this.db
        .prepare(
          `UPDATE songs SET title = ?, author = ?, copyright = ?, ccli = ?, keywords = ?, updated_at = datetime('now')
           WHERE id = ?`
        )
        .run(input.title, input.author, input.copyright, input.ccli, input.keywords, id)
      if (result.changes === 0) throw new Error('Lagu tidak ditemukan. Mungkin sudah dihapus.')
      this.db.prepare('DELETE FROM song_sections WHERE song_id = ?').run(id)
      this.writeSections(id, input)
    })()
    return this.get(id)!
  }

  delete(id: number): void {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM songs_fts WHERE rowid = ?').run(id)
      this.db.prepare('DELETE FROM songs WHERE id = ?').run(id)
    })()
  }

  // Empty query: all songs A–Z. Otherwise: best matches first, with a match
  // in the title counting ten times more than one in the lyrics.
  search(query: string, limit = LIST_LIMIT): SongSummary[] {
    const fts = buildSearchQuery(query)
    const rows = fts
      ? (this.db
          .prepare(
            `SELECT s.id, s.title, s.author FROM songs_fts f JOIN songs s ON s.id = f.rowid
             WHERE songs_fts MATCH ? ORDER BY bm25(songs_fts, 10.0, 1.0, 2.0, 3.0), s.title COLLATE NOCASE
             LIMIT ?`
          )
          .all(fts, limit) as { id: number; title: string; author: string | null }[])
      : (this.db.prepare('SELECT id, title, author FROM songs ORDER BY title COLLATE NOCASE LIMIT ?').all(limit) as {
          id: number
          title: string
          author: string | null
        }[])

    const firstSection = this.db.prepare(
      'SELECT kind, number, text FROM song_sections WHERE song_id = ? ORDER BY position LIMIT 1'
    )
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author ?? '',
      firstLine: songFirstLine([firstSection.get(row.id) as SectionRow].filter(Boolean))
    }))
  }

  private writeSections(songId: number, input: SongInput): void {
    const insert = this.db.prepare(
      'INSERT INTO song_sections (song_id, position, kind, number, text) VALUES (?, ?, ?, ?, ?)'
    )
    input.sections.forEach((section, position) => {
      insert.run(songId, position, section.kind, section.number, section.text)
    })
    this.db.prepare('DELETE FROM songs_fts WHERE rowid = ?').run(songId)
    this.db
      .prepare('INSERT INTO songs_fts (rowid, title, lyrics, author, keywords) VALUES (?, ?, ?, ?, ?)')
      .run(songId, input.title, input.sections.map((s) => s.text).join('\n'), input.author, input.keywords)
  }
}
