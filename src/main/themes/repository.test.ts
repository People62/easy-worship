import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SLIDE_STYLE } from '@shared/live'
import { DEFAULT_THEMES, type MediaRef } from '@shared/theme'
import { migrate } from '../db/migrations'
import { ThemeRepository } from './repository'

let db: Database.Database
let media: Map<number, MediaRef>
let themes: ThemeRepository

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  migrate(db)
  media = new Map([[5, { id: 5, kind: 'video', url: 'egw://media/5-api.mp4', thumbnailUrl: 'egw://thumbs/5.jpg' }]])
  themes = new ThemeRepository(db, (id) => media.get(id) ?? null)
})

afterEach(() => db.close())

describe('ThemeRepository', () => {
  it('creates one default theme per kind, once', () => {
    const created = themes.ensureDefaults()
    expect(Object.keys(created).sort()).toEqual(['bible', 'song', 'text'])
    expect(themes.ensureDefaults()).toEqual({})
    expect(themes.list().map((t) => t.name)).toEqual(['Alkitab · Standar', 'Lagu · Standar', 'Teks · Standar'])
  })

  it('stores only the media id and fills in URLs when reading', () => {
    const theme = themes.create({
      name: 'Api',
      kind: 'song',
      style: { ...DEFAULT_SLIDE_STYLE, background: { kind: 'video', mediaId: 5, url: 'file:///evil', posterUrl: null } }
    })
    const stored = JSON.parse(
      (db.prepare('SELECT data FROM themes WHERE id = ?').get(theme.id) as { data: string }).data
    )
    expect(stored.background).toEqual({ kind: 'video', mediaId: 5 })
    expect(theme.style.background).toEqual({
      kind: 'video',
      mediaId: 5,
      url: 'egw://media/5-api.mp4',
      posterUrl: 'egw://thumbs/5.jpg'
    })
  })

  it('shows a black background when the media was deleted', () => {
    const theme = themes.create({
      name: 'Api',
      kind: 'song',
      style: { ...DEFAULT_SLIDE_STYLE, background: { kind: 'video', mediaId: 5, url: '', posterUrl: null } }
    })
    media.clear()
    expect(themes.get(theme.id)?.style.background).toEqual({ kind: 'color', color: '#000000' })
  })

  it('updates a theme', () => {
    themes.ensureDefaults()
    const song = themes.firstOfKind('song')!
    const updated = themes.update(song.id, {
      name: 'Lagu Besar',
      kind: 'song',
      style: { ...song.style, fontSize: 110 }
    })
    expect(updated).toMatchObject({ name: 'Lagu Besar', style: { fontSize: 110 } })
  })

  it('keeps the last theme of a kind and clears songs that used a deleted theme', () => {
    themes.ensureDefaults()
    const first = themes.firstOfKind('song')!
    expect(() => themes.delete(first.id)).toThrow('Tema terakhir')

    const second = themes.create({ ...DEFAULT_THEMES.song, name: 'Kedua' })
    db.prepare("INSERT INTO songs (title, theme_id) VALUES ('x', ?)").run(second.id)
    themes.delete(second.id)
    expect(themes.get(second.id)).toBeNull()
    expect(db.prepare('SELECT theme_id FROM songs').get()).toEqual({ theme_id: null })
  })

  it('recovers from a damaged theme row', () => {
    db.prepare("INSERT INTO themes (name, kind, data) VALUES ('Rusak', 'bible', '{oops')").run()
    expect(themes.list()[0].style).toEqual(DEFAULT_THEMES.bible.style)
  })
})
