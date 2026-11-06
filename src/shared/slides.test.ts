import { describe, expect, it } from 'vitest'
import { buildSongSlides, chunkLines, sectionJumpKey, sectionSlideTexts } from './slides'

const lines = (n: number): string[] => Array.from({ length: n }, (_, i) => `baris ${i + 1}`)
const sizes = (chunks: string[][]): number[] => chunks.map((c) => c.length)

describe('chunkLines', () => {
  it('keeps short parts on one slide', () => {
    expect(sizes(chunkLines(lines(4), 4))).toEqual([4])
    expect(sizes(chunkLines(lines(1), 4))).toEqual([1])
  })

  it('spreads lines evenly instead of leaving an orphan line', () => {
    expect(sizes(chunkLines(lines(5), 4))).toEqual([3, 2])
    expect(sizes(chunkLines(lines(9), 4))).toEqual([3, 3, 3])
    expect(sizes(chunkLines(lines(10), 4))).toEqual([4, 3, 3])
  })

  it('never goes over the limit', () => {
    for (let n = 1; n <= 30; n++) {
      for (let max = 1; max <= 8; max++) {
        const chunks = chunkLines(lines(n), max)
        expect(chunks.flat()).toEqual(lines(n))
        expect(Math.max(...sizes(chunks))).toBeLessThanOrEqual(max)
      }
    }
  })

  it('returns nothing for no lines and treats a limit below 1 as 1', () => {
    expect(chunkLines([], 4)).toEqual([])
    expect(sizes(chunkLines(lines(2), 0))).toEqual([1, 1])
  })
})

describe('sectionSlideTexts', () => {
  it('starts a new slide at a blank line', () => {
    expect(sectionSlideTexts({ text: 'a\nb\n\nc' }, 4)).toEqual(['a\nb', 'c'])
  })

  it('treats a line with only spaces as a blank line', () => {
    expect(sectionSlideTexts({ text: 'a\n   \nb' }, 4)).toEqual(['a', 'b'])
  })
})

describe('buildSongSlides', () => {
  it('labels slides by section and part', () => {
    const slides = buildSongSlides(
      {
        id: 7,
        sections: [
          { kind: 'verse', number: 1, text: lines(6).join('\n') },
          { kind: 'chorus', number: null, text: 'Kusembah Engkau' }
        ]
      },
      4
    )
    expect(slides.map((s) => s.label)).toEqual(['Verse 1 (1/2)', 'Verse 1 (2/2)', 'Chorus'])
    expect(slides.map((s) => s.id)).toEqual(['song:7:0:0', 'song:7:0:1', 'song:7:1:0'])
  })

  it('marks the first slide of each part with its jump key', () => {
    const slides = buildSongSlides(
      {
        id: 7,
        sections: [
          { kind: 'verse', number: 1, text: 'a\nb\nc\nd\ne' },
          { kind: 'chorus', number: null, text: 'reff' },
          { kind: 'verse', number: 12, text: 'jauh' },
          { kind: 'other', number: null, text: 'lain' }
        ]
      },
      4
    )
    expect(slides.map((s) => s.jump)).toEqual(['1', undefined, 'c', undefined, undefined])
  })
})

describe('sectionJumpKey', () => {
  it('uses the verse number and a letter for other parts', () => {
    expect(sectionJumpKey({ kind: 'verse', number: 3 })).toBe('3')
    expect(sectionJumpKey({ kind: 'verse', number: null })).toBe('1')
    expect(sectionJumpKey({ kind: 'chorus', number: 2 })).toBe('c')
    expect(sectionJumpKey({ kind: 'bridge', number: null })).toBe('b')
    expect(sectionJumpKey({ kind: 'ending', number: null })).toBe('e')
    expect(sectionJumpKey({ kind: 'pre-chorus', number: null })).toBe('p')
    expect(sectionJumpKey({ kind: 'other', number: null })).toBeUndefined()
  })
})
