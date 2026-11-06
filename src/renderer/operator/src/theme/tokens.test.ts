import { describe, expect, it } from 'vitest'
import { contrastRatio } from '@shared/color'
import { PRIMARY_PRESETS } from '@shared/settings'
import { resolveMode, themeVariables } from './tokens'

describe('resolveMode', () => {
  it('follows the system only in system mode', () => {
    expect(resolveMode('system', true)).toBe('dark')
    expect(resolveMode('system', false)).toBe('light')
    expect(resolveMode('light', true)).toBe('light')
    expect(resolveMode('dark', false)).toBe('dark')
  })
})

describe('themeVariables', () => {
  it('keeps gold unchanged in dark mode', () => {
    expect(themeVariables('dark', '#D4A017')['--primary']).toBe('#D4A017')
  })

  it.each(['dark', 'light'] as const)('keeps every preset readable in %s mode', (mode) => {
    for (const preset of PRIMARY_PRESETS) {
      const vars = themeVariables(mode, preset.value)
      expect(contrastRatio(vars['--primary'], vars['--surface'])).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(vars['--primary-text'], vars['--surface'])).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(vars['--on-primary'], vars['--primary'])).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps muted text readable on panels', () => {
    for (const mode of ['dark', 'light'] as const) {
      const vars = themeVariables(mode, '#D4A017')
      expect(contrastRatio(vars['--muted'], vars['--surface'])).toBeGreaterThanOrEqual(4.5)
    }
  })
})
