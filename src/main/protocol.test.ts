import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { parseRange, resolveEgwPath, serveFile } from './protocol'

const userData = join('/', 'data', 'egw')

describe('resolveEgwPath', () => {
  it('maps a logo URL into the church folder', () => {
    expect(resolveEgwPath('egw://church/logo-1.png', userData)).toBe(join(userData, 'church', 'logo-1.png'))
  })

  it('maps media and thumbnails', () => {
    expect(resolveEgwPath('egw://media/12-latar-salib.mp4', userData)).toBe(
      join(userData, 'media', '12-latar-salib.mp4')
    )
    expect(resolveEgwPath('egw://thumbs/12.jpg', userData)).toBe(join(userData, 'thumbs', '12.jpg'))
  })

  it('refuses paths that try to leave the folder', () => {
    expect(resolveEgwPath('egw://church/..%2F..%2Fsecret.png', userData)).toBeNull()
    expect(resolveEgwPath('egw://media/..%2F..%2F1-x.mp4', userData)).toBeNull()
    expect(resolveEgwPath('egw://church/sub/logo.png', userData)).toBeNull()
  })

  it('refuses other hosts and file types', () => {
    expect(resolveEgwPath('egw://db/logo.png', userData)).toBeNull()
    expect(resolveEgwPath('egw://church/notes.txt', userData)).toBeNull()
    expect(resolveEgwPath('egw://media/el-gibbor-worship.sqlite', userData)).toBeNull()
    expect(resolveEgwPath('egw://thumbs/1.png', userData)).toBeNull()
  })
})

describe('parseRange', () => {
  it.each([
    ['bytes=0-99', 1000, [0, 99]],
    ['bytes=900-', 1000, [900, 999]],
    ['bytes=-100', 1000, [900, 999]],
    ['bytes=0-5000', 1000, [0, 999]]
  ])('reads %s', (header, size, expected) => {
    expect(parseRange(header, size)).toEqual(expected)
  })

  it.each([[null], ['bytes=-'], ['bytes=500-100'], ['bytes=2000-'], ['items=0-1']])('ignores %s', (header) => {
    expect(parseRange(header, 1000)).toBeNull()
  })
})

describe('serveFile', () => {
  let dir: string
  let file: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'egw-serve-'))
    file = join(dir, '1-test.mp4')
    await writeFile(file, '0123456789')
  })

  afterAll(() => rm(dir, { recursive: true, force: true }))

  it('serves the whole file', async () => {
    const response = await serveFile(file, null)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('video/mp4')
    expect(await response.text()).toBe('0123456789')
  })

  it('serves part of the file for a range request', async () => {
    const response = await serveFile(file, 'bytes=2-5')
    expect(response.status).toBe(206)
    expect(response.headers.get('content-range')).toBe('bytes 2-5/10')
    expect(await response.text()).toBe('2345')
  })

  it('returns 404 for a missing file', async () => {
    expect((await serveFile(join(dir, 'missing.mp4'), null)).status).toBe(404)
  })
})
