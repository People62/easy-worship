import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SongInput } from '@shared/songs'
import { migrate } from '../db/migrations'
import { buildSearchQuery, SongRepository } from './repository'

let db: Database.Database
let songs: SongRepository

const song = (title: string, lyrics: string, extra: Partial<SongInput> = {}): SongInput => ({
  title,
  author: '',
  copyright: '',
  ccli: '',
  keywords: '',
  sections: [{ kind: 'verse', number: 1, text: lyrics }],
  ...extra
})

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  migrate(db)
  songs = new SongRepository(db)
})

afterEach(() => db.close())

describe('buildSearchQuery', () => {
  it('turns words into quoted prefix terms', () => {
    expect(buildSearchQuery('Bapa  baik')).toBe('"bapa"* "baik"*')
  })

  it('neutralises FTS syntax typed by the operator', () => {
    expect(buildSearchQuery('kasih OR "setia" NEAR(*)')).toBe('"kasih"* "or"* "setia"* "near"*')
  })

  it('returns null when there is nothing to search', () => {
    expect(buildSearchQuery('  ...  ')).toBeNull()
  })
})

describe('SongRepository', () => {
  it('creates and reads a song with its sections in order', () => {
    const created = songs.create({
      ...song('Bapa Engkau Sungguh Baik', 'Bapa Engkau sungguh baik'),
      sections: [
        { kind: 'verse', number: 1, text: 'Bapa Engkau sungguh baik' },
        { kind: 'chorus', number: null, text: 'Kusembah Engkau' }
      ]
    })
    expect(songs.get(created.id)).toMatchObject({
      title: 'Bapa Engkau Sungguh Baik',
      sections: [
        { kind: 'verse', number: 1, text: 'Bapa Engkau sungguh baik' },
        { kind: 'chorus', number: null, text: 'Kusembah Engkau' }
      ]
    })
  })

  it('updates the song, its sections, and the search index', () => {
    const { id } = songs.create(song('Lagu Lama', 'lirik lama'))
    songs.update(id, song('Lagu Baru', 'lirik baru'))
    expect(songs.get(id)?.title).toBe('Lagu Baru')
    expect(songs.search('lama')).toEqual([])
    expect(songs.search('baru').map((s) => s.id)).toEqual([id])
  })

  it('fails to update a song that no longer exists', () => {
    expect(() => songs.update(999, song('x', 'y'))).toThrow('Lagu tidak ditemukan')
  })

  it('deletes a song and removes it from search', () => {
    const { id } = songs.create(song('Haleluya', 'puji Tuhan'))
    songs.delete(id)
    expect(songs.get(id)).toBeNull()
    expect(songs.search('haleluya')).toEqual([])
    expect(db.prepare('SELECT COUNT(*) AS n FROM song_sections').get()).toEqual({ n: 0 })
  })

  it('finds songs by prefix of title or lyrics, ignoring case and accents', () => {
    songs.create(song('Kasih Setia-Mu', 'kasih setiaMu tiada berkesudahan'))
    songs.create(song('Yésus Kekasih Jiwaku', 'Yesus kekasih jiwaku'))
    expect(songs.search('kas set').map((s) => s.title)).toEqual(['Kasih Setia-Mu'])
    expect(songs.search('YESUS').map((s) => s.title)).toEqual(['Yésus Kekasih Jiwaku'])
    expect(songs.search('berkesud').map((s) => s.title)).toEqual(['Kasih Setia-Mu'])
  })

  it('ranks title matches above lyric matches', () => {
    songs.create(song('Bersyukur', 'aku mau bersyukur kepada Tuhan yang baik'))
    songs.create(song('Tuhan Baik', 'nyanyikan lagu baru'))
    expect(songs.search('baik').map((s) => s.title)).toEqual(['Tuhan Baik', 'Bersyukur'])
  })

  it('finds songs by keyword, such as a hymn book number', () => {
    songs.create(song('Ku Berbahagia', 'ku berbahagia', { keywords: 'NKB 12' }))
    expect(songs.search('nkb 12').map((s) => s.title)).toEqual(['Ku Berbahagia'])
  })

  it('lists all songs A to Z for an empty query, with the first line', () => {
    songs.create(song('Mazmur 23', 'Tuhan adalah gembalaku'))
    songs.create(song('Amazing Grace', 'Amazing grace how sweet the sound'))
    expect(songs.search('')).toEqual([
      expect.objectContaining({ title: 'Amazing Grace', firstLine: 'Amazing grace how sweet the sound' }),
      expect.objectContaining({ title: 'Mazmur 23', firstLine: 'Tuhan adalah gembalaku' })
    ])
  })

  it('searches 5,000 songs in under 200 ms', () => {
    const words = ['kasih', 'setia', 'tuhan', 'yesus', 'bapa', 'roh', 'kudus', 'puji', 'sembah', 'damai', 'sukacita']
    const insert = db.transaction(() => {
      for (let i = 0; i < 5000; i++) {
        const lyrics = Array.from({ length: 24 }, (_, j) => words[(i * 7 + j * 3) % words.length]).join(' ')
        songs.create(song(`Lagu ${i} ${words[i % words.length]}`, lyrics))
      }
    })
    insert()
    expect(songs.count()).toBe(5000)

    for (const query of ['kasih', 'yes', 'roh kud', 'lagu 4999', '']) {
      const start = performance.now()
      const results = songs.search(query)
      const elapsed = performance.now() - start
      expect(results.length).toBeGreaterThan(0)
      expect(elapsed).toBeLessThan(200)
    }
  })
})
