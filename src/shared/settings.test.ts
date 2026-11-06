import { describe, expect, it } from 'vitest'
import { applySettingsPatch, DEFAULT_SETTINGS, isLogoFileName, normalizeSettings, PRIMARY_PRESETS } from './settings'

describe('normalizeSettings', () => {
  it('returns defaults for empty or broken input', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('not json object')).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings([1, 2])).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid values and normalizes colors', () => {
    const result = normalizeSettings({
      appearance: { mode: 'light', primary: '#2563eb' },
      output: { displayId: 7, windowed: true },
      church: { logoFile: 'logo.png' }
    })
    expect(result).toEqual({
      appearance: { mode: 'light', primary: '#2563EB' },
      output: { displayId: 7, windowed: true },
      church: { logoFile: 'logo.png' }
    })
  })

  it('replaces only the invalid fields', () => {
    const result = normalizeSettings({ appearance: { mode: 'neon', primary: '#16A34A' }, output: { displayId: 1.5 } })
    expect(result.appearance.mode).toBe('dark')
    expect(result.appearance.primary).toBe('#16A34A')
    expect(result.output.displayId).toBeNull()
  })

  it('drops unknown keys', () => {
    const result = normalizeSettings({ appearance: { mode: 'dark', extra: true }, other: 1 })
    expect(Object.keys(result)).toEqual(['appearance', 'output', 'church'])
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

describe('logo file', () => {
  it('accepts only a bare image file name', () => {
    expect(isLogoFileName('logo.png')).toBe(true)
    expect(isLogoFileName('logo-gpdi.JPG')).toBe(true)
    expect(isLogoFileName('../secret.png')).toBe(false)
    expect(isLogoFileName('C:\\logo.png')).toBe(false)
    expect(isLogoFileName('logo.exe')).toBe(false)
  })

  it('drops a logo path that points outside the app folder', () => {
    expect(normalizeSettings({ church: { logoFile: '../../etc/passwd.png' } }).church.logoFile).toBeNull()
  })

  it('sets and clears the logo and window mode', () => {
    const next = applySettingsPatch(DEFAULT_SETTINGS, { church: { logoFile: 'logo.webp' }, output: { windowed: true } })
    expect(next.church.logoFile).toBe('logo.webp')
    expect(next.output.windowed).toBe(true)
    expect(applySettingsPatch(next, { church: { logoFile: null } }).church.logoFile).toBeNull()
    expect(() => applySettingsPatch(next, { church: { logoFile: 'a/b.png' } })).toThrow('Invalid logo')
  })
})

describe('PRIMARY_PRESETS', () => {
  it('has 8 presets with gold first', () => {
    expect(PRIMARY_PRESETS).toHaveLength(8)
    expect(PRIMARY_PRESETS[0].value).toBe(DEFAULT_SETTINGS.appearance.primary)
  })
})
