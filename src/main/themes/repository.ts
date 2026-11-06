import type Database from 'better-sqlite3'
import {
  DEFAULT_THEMES,
  normalizeStyle,
  resolveBackground,
  storedBackground,
  THEME_KINDS,
  type MediaRef,
  type Theme,
  type ThemeInput,
  type ThemeKind
} from '@shared/theme'

interface ThemeRow {
  id: number
  name: string
  kind: ThemeKind
  data: string
}

export class ThemeRepository {
  constructor(
    private readonly db: Database.Database,
    private readonly findMedia: (id: number) => MediaRef | null
  ) {}

  // Makes sure every kind has at least one theme, so slides always have a
  // style to use. Returns the ids of themes it created, by kind.
  ensureDefaults(): Partial<Record<ThemeKind, number>> {
    const created: Partial<Record<ThemeKind, number>> = {}
    for (const kind of THEME_KINDS) {
      const exists = this.db.prepare('SELECT 1 FROM themes WHERE kind = ?').get(kind)
      if (!exists) created[kind] = this.create(DEFAULT_THEMES[kind]).id
    }
    return created
  }

  list(): Theme[] {
    const rows = this.db
      .prepare('SELECT id, name, kind, data FROM themes ORDER BY kind, name COLLATE NOCASE')
      .all() as ThemeRow[]
    return rows.map((row) => this.toTheme(row))
  }

  get(id: number): Theme | null {
    const row = this.db.prepare('SELECT id, name, kind, data FROM themes WHERE id = ?').get(id) as ThemeRow | undefined
    return row ? this.toTheme(row) : null
  }

  create(input: ThemeInput): Theme {
    const id = Number(
      this.db
        .prepare('INSERT INTO themes (name, kind, data) VALUES (?, ?, ?)')
        .run(input.name, input.kind, this.serialize(input)).lastInsertRowid
    )
    return this.get(id)!
  }

  update(id: number, input: ThemeInput): Theme {
    const result = this.db
      .prepare("UPDATE themes SET name = ?, kind = ?, data = ?, updated_at = datetime('now') WHERE id = ?")
      .run(input.name, input.kind, this.serialize(input), id)
    if (result.changes === 0) throw new Error('Tema tidak ditemukan.')
    return this.get(id)!
  }

  // The last theme of a kind cannot be deleted: slides of that kind need one.
  delete(id: number): void {
    const theme = this.get(id)
    if (!theme) return
    const count = (this.db.prepare('SELECT COUNT(*) AS n FROM themes WHERE kind = ?').get(theme.kind) as { n: number })
      .n
    if (count <= 1) throw new Error('Tema terakhir untuk jenis ini tidak bisa dihapus. Buat tema lain dulu.')
    this.db.transaction(() => {
      this.db.prepare('UPDATE songs SET theme_id = NULL WHERE theme_id = ?').run(id)
      this.db.prepare('DELETE FROM themes WHERE id = ?').run(id)
    })()
  }

  // The first theme of a kind, used when the chosen default is gone.
  firstOfKind(kind: ThemeKind): Theme | null {
    const row = this.db
      .prepare('SELECT id, name, kind, data FROM themes WHERE kind = ? ORDER BY id LIMIT 1')
      .get(kind) as ThemeRow | undefined
    return row ? this.toTheme(row) : null
  }

  // Saved without media URLs: only the media id is stored.
  private serialize(input: ThemeInput): string {
    return JSON.stringify({ ...input.style, background: storedBackground(input.style.background) })
  }

  private toTheme(row: ThemeRow): Theme {
    let raw: unknown
    try {
      raw = JSON.parse(row.data)
    } catch {
      raw = undefined
    }
    const style = normalizeStyle(raw, DEFAULT_THEMES[row.kind].style)
    return {
      id: row.id,
      name: row.name,
      kind: row.kind,
      style: { ...style, background: resolveBackground(style.background, this.findMedia) }
    }
  }
}
