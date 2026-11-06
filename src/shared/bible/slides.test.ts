import { describe, expect, it } from 'vitest'
import { buildBibleSlides, MAX_VERSE_CHARS, splitVerseText } from './slides'

const JOHN_3_16 =
  'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'

describe('splitVerseText', () => {
  it('keeps a normal verse on one slide', () => {
    expect(splitVerseText(JOHN_3_16)).toEqual([JOHN_3_16])
  })

  it('splits a long verse at a sentence or comma, never inside a word', () => {
    const long = Array.from({ length: 8 }, (_, i) => `Kalimat nomor ${i + 1} cukup panjang untuk diuji, ya.`).join(' ')
    const parts = splitVerseText(long, 120)
    expect(parts.length).toBeGreaterThan(1)
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(120)
    expect(parts.join(' ')).toBe(long)
    for (const part of parts.slice(0, -1)) expect(part).toMatch(/[.,]$/)
  })

  it('falls back to a space when there is no punctuation', () => {
    const words = Array.from({ length: 80 }, () => 'kata').join(' ')
    const parts = splitVerseText(words, 100)
    expect(parts.every((p) => p.length <= 100 && !p.startsWith(' '))).toBe(true)
    expect(parts.join(' ')).toBe(words)
  })

  it('collapses extra whitespace and ignores empty verses', () => {
    expect(splitVerseText('  a   b\n c ')).toEqual(['a b c'])
    expect(splitVerseText('   ')).toEqual([])
  })

  it('uses a sensible default limit', () => {
    expect(MAX_VERSE_CHARS).toBeGreaterThan(200)
  })
})

describe('buildBibleSlides', () => {
  it('builds one slide per verse with caption and label', () => {
    const slides = buildBibleSlides(
      [
        { book: 43, chapter: 3, verse: 16, text: JOHN_3_16 },
        { book: 43, chapter: 3, verse: 17, text: 'For God sent not his Son into the world to condemn the world.' }
      ],
      'KJV'
    )
    expect(slides.map((s) => s.label)).toEqual(['Yoh 3:16', 'Yoh 3:17'])
    expect(slides[0]).toMatchObject({ caption: 'Yohanes 3:16 (KJV)', uppercase: false, id: 'bible:KJV:43:3:16:0' })
  })
})
