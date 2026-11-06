import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, isAbsolute, join, relative } from 'node:path'
import { Readable } from 'node:stream'
import { protocol } from 'electron'
import { isLogoFileName } from '@shared/settings'
import { churchDir } from './church/logo'
import { MEDIA_FILE, mediaDir, THUMB_FILE, thumbsDir } from './media/library'

// egw://<folder>/<file> serves files from the app's user data folder to the
// windows. Pages cannot read arbitrary disk paths, only these three folders,
// and only file names in the exact format the app itself creates.

const FOLDERS = {
  church: { dir: churchDir, valid: isLogoFileName },
  media: { dir: mediaDir, valid: (name: string) => MEDIA_FILE.test(name) },
  thumbs: { dir: thumbsDir, valid: (name: string) => THUMB_FILE.test(name) }
} as const

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm'
}

export function registerEgwScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'egw',
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true }
    }
  ])
}

// Returns the file path for a URL, or null if the URL asks for anything
// outside the allowed folders.
export function resolveEgwPath(url: string, userDataDir: string): string | null {
  const { host, pathname } = new URL(url)
  const folder = FOLDERS[host as keyof typeof FOLDERS]
  if (!folder) return null
  const name = decodeURIComponent(pathname.replace(/^\//, ''))
  if (!folder.valid(name)) return null

  const dir = folder.dir(userDataDir)
  const file = join(dir, name)
  const rel = relative(dir, file)
  if (rel.startsWith('..') || isAbsolute(rel)) return null
  return file
}

// "bytes=100-199" → [100, 199]. Video players ask for parts of the file to
// seek and loop; without this a <video> cannot jump or restart smoothly.
export function parseRange(header: string | null, size: number): [number, number] | null {
  const match = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null
  if (!match || size === 0) return null
  const [, a, b] = match
  if (a === '' && b === '') return null
  let start: number
  let end: number
  if (a === '') {
    start = Math.max(0, size - Number(b))
    end = size - 1
  } else {
    start = Number(a)
    end = b === '' ? size - 1 : Math.min(Number(b), size - 1)
  }
  return start <= end && start < size ? [start, end] : null
}

export async function serveFile(file: string, rangeHeader: string | null): Promise<Response> {
  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) return new Response('Not found', { status: 404 })
  const type = CONTENT_TYPES[extname(file).slice(1).toLowerCase()] ?? 'application/octet-stream'
  const range = parseRange(rangeHeader, info.size)
  const [start, end] = range ?? [0, info.size - 1]
  const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream
  const headers: Record<string, string> = {
    'Content-Type': type,
    'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
    // Lets the operator window draw media onto a canvas to make thumbnails.
    // Only our own windows can load egw:// at all.
    'Access-Control-Allow-Origin': '*'
  }
  if (range) headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`
  return new Response(body, { status: range ? 206 : 200, headers })
}

export function handleEgwProtocol(userDataDir: string): void {
  protocol.handle('egw', (request) => {
    const file = resolveEgwPath(request.url, userDataDir)
    if (!file) return new Response('Not found', { status: 404 })
    return serveFile(file, request.headers.get('range'))
  })
}
