import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveEgwPath } from './protocol'

const userData = join('/', 'data', 'egw')

describe('resolveEgwPath', () => {
  it('maps a logo URL into the church folder', () => {
    expect(resolveEgwPath('egw://church/logo-1.png', userData)).toBe(join(userData, 'church', 'logo-1.png'))
  })

  it('refuses paths that try to leave the folder', () => {
    expect(resolveEgwPath('egw://church/..%2F..%2Fsecret.png', userData)).toBeNull()
    expect(resolveEgwPath('egw://church/sub/logo.png', userData)).toBeNull()
  })

  it('refuses other hosts and file types', () => {
    expect(resolveEgwPath('egw://media/logo.png', userData)).toBeNull()
    expect(resolveEgwPath('egw://church/notes.txt', userData)).toBeNull()
  })
})
