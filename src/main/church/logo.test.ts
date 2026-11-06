import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { churchDir, importLogo, logoUrl, removeLogos } from './logo'

let userData: string
let source: string

beforeEach(async () => {
  userData = await mkdtemp(join(tmpdir(), 'egw-logo-'))
  source = join(userData, 'GPdI Logo.PNG')
  await writeFile(source, 'fake image')
})

afterEach(() => rm(userData, { recursive: true, force: true }))

describe('importLogo', () => {
  it('copies the logo into the church folder with a safe name', async () => {
    const name = await importLogo(source, userData, 1000)
    expect(name).toBe('logo-1000.png')
    expect(await readdir(churchDir(userData))).toEqual(['logo-1000.png'])
  })

  it('replaces the previous logo', async () => {
    await importLogo(source, userData, 1000)
    await importLogo(source, userData, 2000)
    expect(await readdir(churchDir(userData))).toEqual(['logo-2000.png'])
  })

  it('rejects files that are not images', async () => {
    const exe = join(userData, 'logo.exe')
    await writeFile(exe, 'x')
    await expect(importLogo(exe, userData)).rejects.toThrow('Format logo tidak didukung')
  })
})

describe('removeLogos', () => {
  it('removes all logos and works when the folder does not exist', async () => {
    await removeLogos(userData)
    await importLogo(source, userData, 1000)
    await removeLogos(userData)
    expect(await readdir(churchDir(userData))).toEqual([])
  })
})

describe('logoUrl', () => {
  it('builds an egw:// URL', () => {
    expect(logoUrl('logo-1.png')).toBe('egw://church/logo-1.png')
    expect(logoUrl(null)).toBeNull()
  })
})
