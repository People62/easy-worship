import { describe, expect, it } from 'vitest'
import { formatVersionLabel } from './version'

describe('formatVersionLabel', () => {
  it('adds a v prefix for packaged builds', () => {
    expect(formatVersionLabel('1.0.0', true)).toBe('v1.0.0')
  })

  it('marks development builds', () => {
    expect(formatVersionLabel('0.1.0', false)).toBe('v0.1.0 (dev)')
  })

  it('accepts an existing v prefix and pre-release tags', () => {
    expect(formatVersionLabel('v0.9.0-beta.1', true)).toBe('v0.9.0-beta.1')
  })

  it('rejects invalid versions', () => {
    expect(() => formatVersionLabel('latest', true)).toThrow('Invalid version')
  })
})
