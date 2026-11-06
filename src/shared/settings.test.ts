import { describe, expect, it } from 'vitest'
import { applySettingsPatch, DEFAULT_SETTINGS, normalizeSettings, PRIMARY_PRESETS } from './settings'

describe('normalizeSettings', () => {
  it('returns defaults for empty or broken input', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('not json object')).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings([1, 2])).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid values and normalizes colors', () => {
    const result = normalizeSettings({ appearance: { mode: 'light', primary: '#2563eb' }, output: { displayId: 7 } })
    expect(result).toEqual({ appearance: { mode: 'light', primary: '#2563EB' }, output: { displayId: 7 } })
  })

  it('replaces only the invalid fields', () => {
    const result = normalizeSettings({ appearance: { mode: 'neon', primary: '#16A34A' }, output: { displayId: 1.5 } })
    expect(result.appearance.mode).toBe('dark')
    expect(result.appearance.primary).toBe('#16A34A')
    expect(result.output.displayId).toBeNull()
  })

  it('drops unknown keys', () => {
    const result = normalizeSettings({ appearance: { mode: 'dark', extra: true }, other: 1 })
    expect(Object.keys(result)).toEqual(['appearance', 'output'])
    expect(Object.keys(result.appearance)).toEqual(['mode', 'primary'])
  })
})

describe('applySettingsPatch', () => {
  it('changes only the patched fields', () => {
    const next = applySettingsPatch(DEFAULT_SETTINGS, { appearance: { mode: 'system' } })
    expect(next.appearance).toEqual({ mode: 'system', primary: '#D4A017' })
    expect(next.output).toEqual(DEFAULT_SETTINGS.output)
  })

  it('does not mutate the current settings', () => {
    const current = structuredClone(DEFAULT_SETTINGS)
    applySettingsPatch(current, { appearance: { primary: '#123456' } })
    expect(current).toEqual(DEFAULT_SETTINGS)
  })

  it('rejects invalid values', () => {
    expect(() => applySettingsPatch(DEFAULT_SETTINGS, { appearance: { primary: 'gold' } })).toThrow('Invalid primary')
    expect(() => applySettingsPatch(DEFAULT_SETTINGS, { output: { displayId: -0.5 } })).toThrow('Invalid display')
  })

  it('allows clearing the output display', () => {
    const withDisplay = applySettingsPatch(DEFAULT_SETTINGS, { output: { displayId: 3 } })
    expect(applySettingsPatch(withDisplay, { output: { displayId: null } }).output.displayId).toBeNull()
  })
})

describe('PRIMARY_PRESETS', () => {
  it('has 8 presets with gold first', () => {
    expect(PRIMARY_PRESETS).toHaveLength(8)
    expect(PRIMARY_PRESETS[0].value).toBe(DEFAULT_SETTINGS.appearance.primary)
  })
})
