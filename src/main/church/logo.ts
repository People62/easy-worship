import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { isLogoFileName } from '@shared/settings'
import { t } from '@shared/i18n'

export const LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] as const
const MAX_LOGO_BYTES = 10 * 1024 * 1024

export function churchDir(userDataDir: string): string {
  return join(userDataDir, 'church')
}

export function logoUrl(fileName: string | null): string | null {
  return fileName ? `egw://church/${encodeURIComponent(fileName)}` : null
}

// Copies the chosen image into the app's own folder, so the logo keeps
// working even if the original file is moved or the USB stick is removed.
// The new name changes on every import, which also busts the image cache.
export async function importLogo(sourcePath: string, userDataDir: string, now = Date.now()): Promise<string> {
  const ext = extname(sourcePath).slice(1).toLowerCase()
  if (!(LOGO_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error(t('Format logo tidak didukung: .{ext}. Pakai PNG, JPG, WEBP, GIF, atau SVG.', { ext }))
  }
  const info = await stat(sourcePath)
  if (info.size > MAX_LOGO_BYTES) throw new Error(t('File logo terlalu besar (maksimal 10 MB).'))

  const dir = churchDir(userDataDir)
  await mkdir(dir, { recursive: true })
  const fileName = `logo-${now}.${ext}`
  await copyFile(sourcePath, join(dir, fileName))
  await removeLogos(userDataDir, fileName)
  return fileName
}

// Deletes every logo file except the one to keep.
export async function removeLogos(userDataDir: string, keep: string | null = null): Promise<void> {
  const dir = churchDir(userDataDir)
  const files = await readdir(dir).catch(() => [] as string[])
  await Promise.all(
    files
      .filter((file) => file !== keep && file.startsWith('logo-') && isLogoFileName(file))
      .map((file) => rm(join(dir, file), { force: true }))
  )
}
