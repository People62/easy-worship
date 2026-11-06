import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../db/migrations'
import { fileSlug, MediaLibrary, mediaDir, mediaKind, MEDIA_FILE, thumbsDir } from './library'

let db: Database.Database
let userData: string
let library: MediaLibrary

const TINY_JPEG = 'data:image/jpeg;base64,' + Buffer.from('fake jpeg bytes').toString('base64')

beforeEach(async () => {
  db = new Database(':memory:')
  migrate(db)
  userData = await mkdtemp(join(tmpdir(), 'egw-media-'))
  library = new MediaLibrary(db, userData)
})

afterEach(async () => {
  db.close()
  await rm(userData, { recursive: true, force: true })
})

async function sourceFile(name: string): Promise<string> {
  const path = join(userData, name)
  await writeFile(path, 'content')
  return path
}

describe('helpers', () => {
  it('detects the media kind from the extension', () => {
    expect(mediaKind('a.JPG')).toBe('image')
    expect(mediaKind('a.mp4')).toBe('video')
    expect(mediaKind('a.mov')).toBeNull()
  })

  it('makes safe file names', () => {
    expect(fileSlug('C:/Video/Latar Salib (1080p).MP4')).toBe('latar-salib-1080p')
    expect(fileSlug('???.png')).toBe('media')
    expect(MEDIA_FILE.test(`12-${fileSlug('Latar Salib.mp4')}.mp4`)).toBe(true)
  })
})

describe('MediaLibrary', () => {
  it('copies files into the media folder and lists them newest first', async () => {
    const { imported, failed } = await library.importFiles([await sourceFile('Salib.jpg'), await sourceFile('Api.mp4')])
    expect(failed).toEqual([])
    expect(imported.map((m) => [m.kind, m.name])).toEqual([
      ['image', 'Salib'],
      ['video', 'Api']
    ])
    expect((await readdir(mediaDir(userData))).sort()).toEqual(['1-salib.jpg', '2-api.mp4'])
    expect(library.list().map((m) => m.id)).toEqual([2, 1])
    expect(imported[0].url).toBe('egw://media/1-salib.jpg')
  })

  it('reports files it cannot import and keeps going', async () => {
    const { imported, failed } = await library.importFiles([await sourceFile('notes.txt'), await sourceFile('ok.png')])
    expect(imported).toHaveLength(1)
    expect(failed).toEqual([{ file: 'notes.txt', error: expect.stringContaining('Format tidak didukung') }])
  })

  it('stores the size, duration, and thumbnail made by the renderer', async () => {
    const { imported } = await library.importFiles([await sourceFile('Api.mp4')])
    const item = await library.setInfo(imported[0].id, {
      width: 1920,
      height: 1080,
      durationMs: 12000,
      thumbnail: TINY_JPEG
    })
    expect(item).toMatchObject({ width: 1920, height: 1080, durationMs: 12000, thumbnailUrl: 'egw://thumbs/1.jpg' })
    expect(await readdir(thumbsDir(userData))).toEqual(['1.jpg'])
  })

  it('rejects thumbnails that are not JPEG data URLs', async () => {
    const { imported } = await library.importFiles([await sourceFile('a.png')])
    await expect(
      library.setInfo(imported[0].id, { width: 1, height: 1, durationMs: null, thumbnail: 'data:text/html,<b>' })
    ).rejects.toThrow('Thumbnail tidak valid')
  })

  it('renames and deletes media with its files', async () => {
    const { imported } = await library.importFiles([await sourceFile('a.png')])
    const id = imported[0].id
    await library.setInfo(id, { width: 10, height: 10, durationMs: null, thumbnail: TINY_JPEG })
    expect(library.rename(id, 'Latar biru').name).toBe('Latar biru')
    await library.delete(id)
    expect(library.list()).toEqual([])
    expect(await readdir(mediaDir(userData))).toEqual([])
    expect(await readdir(thumbsDir(userData))).toEqual([])
  })
})
