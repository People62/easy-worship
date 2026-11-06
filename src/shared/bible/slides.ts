import type { Slide } from '../live'
import { formatReference, verseLabel, type BibleReference } from './reference'

export interface BibleVerse {
  book: number
  chapter: number
  verse: number
  text: string
}

// About 6 lines at the Bible font size on a 1920×1080 slide.
export const MAX_VERSE_CHARS = 260

// Splits a long verse into parts that fit on a slide, preferring to break
// after a sentence or clause, and never inside a word.
export function splitVerseText(text: string, maxChars = MAX_VERSE_CHARS): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxChars) return clean ? [clean] : []

  const count = Math.ceil(clean.length / maxChars)
  const target = Math.ceil(clean.length / count)
  const parts: string[] = []
  let rest = clean
  while (rest.length > maxChars) {
    const window = rest.slice(0, maxChars + 1)
    const breakAt = (pattern: RegExp): number => {
      let best = -1
      for (const m of window.matchAll(pattern)) {
        const end = (m.index ?? 0) + m[0].length
        if (end >= target * 0.6 && end <= maxChars) best = end
        if (end > target) break
      }
      return best
    }
    let cut = breakAt(/[.!?;:]["”’)]?\s/g)
    if (cut < 0) cut = breakAt(/,\s/g)
    if (cut < 0) cut = window.lastIndexOf(' ') + 1
    if (cut <= 0) cut = maxChars
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

// One slide per verse (or per part of a long verse). The caption shows the
// verse and translation; the operator label is the short reference.
export function buildBibleSlides(verses: BibleVerse[], versionAbbreviation: string): Slide[] {
  return verses.flatMap((v) => {
    const parts = splitVerseText(v.text)
    const caption = `${verseLabel(v.book, v.chapter, v.verse, false)} (${versionAbbreviation})`
    return parts.map((text, part) => ({
      id: `bible:${versionAbbreviation}:${v.book}:${v.chapter}:${v.verse}:${part}`,
      text,
      caption,
      label: `${verseLabel(v.book, v.chapter, v.verse)}${parts.length > 1 ? ` (${part + 1}/${parts.length})` : ''}`,
      uppercase: false,
      fontScale: 0.8
    }))
  })
}

export function passageTitle(reference: BibleReference, versionAbbreviation: string): string {
  return `${formatReference(reference)} (${versionAbbreviation})`
}
