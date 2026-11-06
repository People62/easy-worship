import { describe, expect, it } from 'vitest'
import { contrastRatio, ensureContrast, isHexColor, normalizeHex, parseHex, readableTextColor } from './color'

describe('hex parsing', () => {
  it('accepts 3 and 6 digit colors', () => {
    expect(isHexColor('#fff')).toBe(true)
    expect(isHexColor('#D4A017')).toBe(true)
    expect(isHexColor('D4A017')).toBe(false)
    expect(isHexColor('#12345')).toBe(false)
    expect(isHexColor(42)).toBe(false)
  })

  it('parses and normalizes to upper case 6 digits', () => {
    expect(parseHex('#d4a017')).toEqual({ r: 212, g: 160, b: 23 })
    expect(normalizeHex('#abc')).toBe('#AABBCC')
  })

  it('throws on invalid input', () => {
    expect(() => parseHex('gold')).toThrow('Invalid hex color')
  })
})

describe('contrast', () => {
  it('matches the WCAG extremes', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })

  it('picks dark text on gold and white text on blue', () => {
    expect(readableTextColor('#D4A017')).toBe('#000000')
    expect(readableTextColor('#2563EB')).toBe('#FFFFFF')
  })
})

describe('ensureContrast', () => {
  it('keeps a color that already has enough contrast', () => {
    expect(ensureContrast('#D4A017', '#171412', 3)).toBe('#D4A017')
  })

  it('darkens gold on a white background until readable', () => {
    const adjusted = ensureContrast('#D4A017', '#FFFFFF', 4.5)
    expect(adjusted).not.toBe('#D4A017')
    expect(contrastRatio(adjusted, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
  })

  it('lightens a dark color on a dark background', () => {
    const adjusted = ensureContrast('#1E1B4B', '#171412', 3)
    expect(contrastRatio(adjusted, '#171412')).toBeGreaterThanOrEqual(3)
  })
})
