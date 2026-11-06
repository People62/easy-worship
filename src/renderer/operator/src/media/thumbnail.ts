import type { MediaInfo, MediaItem } from '@shared/ipc'

const THUMB_WIDTH = 320
const THUMB_HEIGHT = 180
const TIMEOUT_MS = 15_000

function draw(source: CanvasImageSource, width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = THUMB_WIDTH
  canvas.height = THUMB_HEIGHT
  const context = canvas.getContext('2d')!
  context.fillStyle = '#000'
  context.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT)
  // Cover the 16:9 box, like the slide background does.
  const scale = Math.max(THUMB_WIDTH / width, THUMB_HEIGHT / height)
  const w = width * scale
  const h = height * scale
  context.drawImage(source, (THUMB_WIDTH - w) / 2, (THUMB_HEIGHT - h) / 2, w, h)
  return canvas.toDataURL('image/jpeg', 0.8)
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Waktu habis membaca media.')), TIMEOUT_MS))
  ])
}

function imageInfo(url: string): Promise<MediaInfo> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    // egw:// is another origin than the page; without CORS the canvas would
    // refuse to export the thumbnail.
    image.crossOrigin = 'anonymous'
    image.onload = () =>
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        durationMs: null,
        thumbnail: draw(image, image.naturalWidth, image.naturalHeight)
      })
    image.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'))
    image.src = url
  })
}

function videoInfo(url: string): Promise<MediaInfo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'auto'
    video.onloadedmetadata = () => {
      // A frame a little way in is usually more typical than the first one.
      video.currentTime = Math.min(1, video.duration / 3 || 0)
    }
    video.onseeked = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : null,
        thumbnail: draw(video, video.videoWidth, video.videoHeight)
      })
      video.removeAttribute('src')
      video.load()
    }
    video.onerror = () => reject(new Error('Video tidak bisa diputar. Gunakan MP4 (H.264) atau WEBM.'))
    video.src = url
  })
}

// Reads the size and a still frame of an image or video in the browser,
// which already knows how to decode them.
export function makeThumbnail(item: Pick<MediaItem, 'kind' | 'url'>): Promise<MediaInfo> {
  return withTimeout(item.kind === 'image' ? imageInfo(item.url) : videoInfo(item.url))
}
