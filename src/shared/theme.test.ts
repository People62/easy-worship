import { describe, expect, it } from 'vitest'
import { DEFAULT_SLIDE_STYLE } from './live'
import { DEFAULT_THEMES, normalizeStyle, resolveBackground, storedBackground, validateThemeInput } from './theme'

describe('normalizeStyle', () => {
  it('returns the default style for missing or broken input', () => {
    expect(normalizeStyle(undefined)).toEqual(DEFAULT_SLIDE_STYLE)
    expect(normalizeStyle('nope')).toEqual(DEFAULT_SLIDE_STYLE)
  })

  it('clamps numbers into their limits', () => {
    const style = normalizeStyle({ fontSize: 999, lineHeight: 0.1, outlineWidth: -3, margin: 10, backgroundDim: 2 })
    expect(style).toMatchObject({ fontSize: 160, lineHeight: 0.9, outlineWidth: 0, margin: 40, backgroundDim: 0.8 })
  })

  it('rejects colors and fonts that are not safe', () => {
    const style = normalizeStyle({ color: 'red', fontFamily: 'Arial; background: url(x)' })
    expect(style.color).toBe(DEFAULT_SLIDE_STYLE.color)
    expect(style.fontFamily).toBe(DEFAULT_SLIDE_STYLE.fontFamily)
  })

  it('keeps valid values', () => {
    const style = normalizeStyle({ fontFamily: 'Georgia, serif', color: '#ffcc00', align: 'left', uppercase: false })
    expect(style).toMatchObject({ fontFamily: 'Georgia, serif', color: '#FFCC00', align: 'left', uppercase: false })
  })

  it('keeps only the media id of a media background', () => {
    expect(
      normalizeStyle({ background: { kind: 'video', mediaId: 4, url: 'file:///C:/evil.mp4' } }).background
    ).toEqual({
      kind: 'video',
      mediaId: 4,
      url: '',
      posterUrl: null
    })
  })
})

describe('storedBackground', () => {
  it('drops URLs and invalid ids', () => {
    expect(storedBackground({ kind: 'image', mediaId: 2, url: 'x' })).toEqual({ kind: 'image', mediaId: 2 })
    expect(storedBackground({ kind: 'image', mediaId: -1 })).toEqual({ kind: 'color', color: '#000000' })
  })
})

describe('resolveBackground', () => {
  const media = { id: 3, kind: 'video' as const, url: 'egw://media/3-a.mp4', thumbnailUrl: 'egw://thumbs/3.jpg' }

  it('fills in the media URLs', () => {
    expect(resolveBackground({ kind: 'video', mediaId: 3, url: '', posterUrl: null }, () => media)).toEqual({
      kind: 'video',
      mediaId: 3,
      url: 'egw://media/3-a.mp4',
      posterUrl: 'egw://thumbs/3.jpg'
    })
  })

  it('falls back to black when the media is gone', () => {
    expect(resolveBackground({ kind: 'image', mediaId: 9, url: '' }, () => null)).toEqual({
      kind: 'color',
      color: '#000000'
    })
  })
})

describe('validateThemeInput', () => {
  it('requires a name and a known kind', () => {
    expect(() => validateThemeInput({ name: ' ', kind: 'song' })).toThrow('Nama tema wajib')
    expect(() => validateThemeInput({ name: 'A', kind: 'video' })).toThrow('Jenis tema')
  })

  it('fills missing style fields from the default of that kind', () => {
    expect(validateThemeInput({ name: 'Ayat', kind: 'bible', style: {} }).style).toEqual(DEFAULT_THEMES.bible.style)
  })
})
