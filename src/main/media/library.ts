import { copyFile, mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import type Database from 'better-sqlite3'
import type { MediaRef } from '@shared/theme'
import { t } from '@shared/i18n'

export type MediaKind = 'image' | 'video'

export interface MediaItem extends MediaRef {
  name: string
  width: number | null
  height: number | null
  durationMs: number | null
  sizeBytes: number
}

export interface MediaInfo {
  width: number
  height: number
  durationMs: number | null
  // A small JPEG still made by the renderer: "data:image/jpeg;base64,…".
  thumbnail: string
}

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const
export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'm4v'] as const
const MAX_IMAGE_BYTES = 50 * 1024 * 1024
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024
const MAX_THUMBNAIL_BYTES = 1024 * 1024

export const MEDIA_FILE = /^\d+-[\w-]{1,80}\.(jpe?g|png|webp|mp4|webm|m4v)$/i
export const THUMB_FILE = /^\d+\.jpg$/

export function mediaDir(userDataDir: string): string {
  return join(userDataDir, 'media')
}

export function thumbsDir(userDataDir: string): string {
  return join(userDataDir, 'thumbs')
}

export function mediaKind(path: string): MediaKind | null {
  const ext = extname(path).slice(1).toLowerCase()
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) return 'image'
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(ext)) return 'video'
  return null
}

// "Latar Salib (1080p).MP4" → "latar-salib-1080p"
export function fileSlug(path: string): string {
  const slug = basename(path, extname(path))
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .slice(0, 60)
  return slug || 'media'
}

interface MediaRow {
  id: number
  kind: MediaKind
  path: string
  name: string
  width: number | null
  height: number | null
  duration_ms: number | null
  size_bytes: number
  thumbnail: string | null
}

// Media files are copied into the app's own folder, so backgrounds keep
// working when the original file or USB stick is gone.
export class MediaLibrary {
  constructor(
    private readonly db: Database.Database,
    private readonly userDataDir: string
  ) {}

  list(): MediaItem[] {
    const rows = this.db.prepare('SELECT * FROM media ORDER BY created_at DESC, id DESC').all() as MediaRow[]
    return rows.map((row) => this.toItem(row))
  }

  get(id: number): MediaItem | null {
    const row = this.db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined
    return row ? this.toItem(row) : null
  }

  // Imports files one by one. Files that cannot be imported are reported
  // back instead of stopping the rest.
  async importFiles(paths: string[]): Promise<{ imported: MediaItem[]; failed: { file: string; error: string }[] }> {
    const imported: MediaItem[] = []
    const failed: { file: string; error: string }[] = []
    await mkdir(mediaDir(this.userDataDir), { recursive: true })

    for (const source of paths) {
      try {
        imported.push(await this.importFile(source))
      } catch (error) {
        failed.push({ file: basename(source), error: error instanceof Error ? error.message : String(error) })
      }
    }
    return { imported, failed }
  }

  async setInfo(id: number, info: MediaInfo): Promise<MediaItem> {
    const item = this.get(id)
    if (!item) throw new Error(t('Media tidak ditemukan.'))
    const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(info.thumbnail)
    if (!match) throw new Error(t('Thumbnail tidak valid.'))
    const bytes = Buffer.from(match[1], 'base64')
    if (bytes.length > MAX_THUMBNAIL_BYTES) throw new Error(t('Thumbnail terlalu besar.'))

    await mkdir(thumbsDir(this.userDataDir), { recursive: true })
    const thumbnail = `${id}.jpg`
    await writeFile(join(thumbsDir(this.userDataDir), thumbnail), bytes)

    const size = (n: unknown): number | null => (Number.isInteger(n) && (n as number) > 0 ? (n as number) : null)
    this.db
      .prepare('UPDATE media SET width = ?, height = ?, duration_ms = ?, thumbnail = ? WHERE id = ?')
      .run(size(info.width), size(info.height), size(info.durationMs), thumbnail, id)
    return this.get(id)!
  }

  rename(id: number, name: string): MediaItem {
    const clean = name.trim().slice(0, 120)
    if (!clean) throw new Error(t('Nama media wajib diisi.'))
    if (this.db.prepare('UPDATE media SET name = ? WHERE id = ?').run(clean, id).changes === 0) {
      throw new Error(t('Media tidak ditemukan.'))
    }
    return this.get(id)!
  }

  async delete(id: number): Promise<void> {
    const row = this.db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined
    if (!row) return
    this.db.prepare('DELETE FROM media WHERE id = ?').run(id)
    if (MEDIA_FILE.test(row.path)) await rm(join(mediaDir(this.userDataDir), row.path), { force: true })
    if (row.thumbnail && THUMB_FILE.test(row.thumbnail)) {
      await rm(join(thumbsDir(this.userDataDir), row.thumbnail), { force: true })
    }
  }

  private async importFile(source: string): Promise<MediaItem> {
    const kind = mediaKind(source)
    if (!kind) throw new Error(t('Format tidak didukung. Gambar: JPG, PNG, WEBP. Video: MP4, WEBM.'))
    const info = await stat(source)
    const limit = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
    if (info.size > limit)
      throw new Error(t('File terlalu besar (maksimal {max}).', { max: kind === 'image' ? '50 MB' : '2 GB' }))

    const ext = extname(source).slice(1).toLowerCase()
    const name = basename(source, extname(source)).slice(0, 120)
    // Insert first to get the id, then copy under a name that starts with it.
    const id = Number(
      this.db
        .prepare('INSERT INTO media (kind, path, name, size_bytes) VALUES (?, ?, ?, ?)')
        .run(kind, `pending-${Date.now()}-${Math.random()}`, name, info.size).lastInsertRowid
    )
    const fileName = `${id}-${fileSlug(source)}.${ext}`
    try {
      await copyFile(source, join(mediaDir(this.userDataDir), fileName))
      this.db.prepare('UPDATE media SET path = ? WHERE id = ?').run(fileName, id)
    } catch (error) {
      this.db.prepare('DELETE FROM media WHERE id = ?').run(id)
      throw error
    }
    return this.get(id)!
  }

  private toItem(row: MediaRow): MediaItem {
    return {
      id: row.id,
      kind: row.kind,
      name: row.name,
      url: `egw://media/${encodeURIComponent(row.path)}`,
      thumbnailUrl: row.thumbnail ? `egw://thumbs/${encodeURIComponent(row.thumbnail)}` : null,
      width: row.width,
      height: row.height,
      durationMs: row.duration_ms,
      sizeBytes: row.size_bytes
    }
  }
}
