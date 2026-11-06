import { bookById, findBooks, type BibleBook } from './books'
import { t } from '../i18n'

// A passage the operator asked for. Verse ranges may cross chapters
// ("kej 1:31-2:3"). A whole chapter ("mzm 23") has no verses.
export interface VerseRange {
  startChapter: number
  startVerse: number | null
  endChapter: number
  endVerse: number | null
}

export interface BibleReference {
  book: number
  ranges: VerseRange[]
}

export type ParseResult =
  { ok: true; reference: BibleReference } | { ok: false; error: string; suggestions: BibleBook[] }

const MAX_NUMBER = 200

// "yoh 3:16-18", "1kor13:4", "mzm 23", "yoh 3 16", "yoh 3.16,18-20",
// "kej 1:31-2:3", "john 3:16".
export function parseReference(input: string): ParseResult {
  const text = input.trim().replace(/[–—]/g, '-')
  // Book: optional leading number, then letters (with spaces or hyphens).
  const match = /^([1-3]\s*)?([\p{L}][\p{L}\s.-]*?)\s*(\d.*)?$/u.exec(text)
  if (!match) return { ok: false, error: t('Ketik nama kitab, contoh: yoh 3:16'), suggestions: [] }

  const bookText = `${match[1] ?? ''}${match[2]}`
  const books = findBooks(bookText)
  if (books.length === 0)
    return { ok: false, error: t('Kitab "{book}" tidak dikenal.', { book: bookText.trim() }), suggestions: [] }
  if (books.length > 1) {
    return {
      ok: false,
      error: t('"{book}" bisa berarti beberapa kitab. Ketik lebih lengkap.', { book: bookText.trim() }),
      suggestions: books
    }
  }
  const book = books[0]

  const rest = (match[3] ?? '').replace(/\s+/g, ' ').trim()
  if (!rest)
    return { ok: false, error: t('Ketik pasal, contoh: {abbr} 1', { abbr: book.abbreviation }), suggestions: [book] }

  const ranges = parseRanges(rest)
  if (!ranges)
    return { ok: false, error: t('Format pasal dan ayat tidak dikenali. Contoh: 3:16-18'), suggestions: [book] }
  return { ok: true, reference: { book: book.id, ranges } }
}

function parseRanges(text: string): VerseRange[] | null {
  // Normalise "3 16" and "3.16" to "3:16".
  const normal = text.replace(/^(\d+)[ .](\d)/, '$1:$2').replace(/\s*([,;:-])\s*/g, '$1')
  const parts = normal.split(/[,;]/)
  const ranges: VerseRange[] = []
  let chapter: number | null = null

  for (const part of parts) {
    const m = /^(?:(\d+):)?(\d+)(?:-(?:(\d+):)?(\d+))?$/.exec(part)
    if (!m) return null
    const [, c1, n1, c2, n2] = m
    const numbers = [c1, n1, c2, n2].filter(Boolean).map(Number)
    if (numbers.some((n) => n < 1 || n > MAX_NUMBER)) return null

    if (chapter === null && c1 === undefined) {
      // The first part without a colon is a chapter: "mzm 23" or "mzm 23-24".
      const start = Number(n1)
      const end = c2 === undefined && n2 !== undefined ? Number(n2) : start
      if (c2 !== undefined || end < start) return null
      ranges.push({ startChapter: start, startVerse: null, endChapter: end, endVerse: null })
      if (parts.length > 1) return null
      return ranges
    }

    const startChapter = c1 !== undefined ? Number(c1) : chapter!
    const startVerse = Number(n1)
    let endChapter = startChapter
    let endVerse = startVerse
    if (n2 !== undefined) {
      endChapter = c2 !== undefined ? Number(c2) : startChapter
      endVerse = Number(n2)
    }
    if (endChapter < startChapter || (endChapter === startChapter && endVerse < startVerse)) return null
    ranges.push({ startChapter, startVerse, endChapter, endVerse })
    chapter = endChapter
  }
  return ranges
}

// "Yohanes 3:16-18", "Mazmur 23", "Kejadian 1:31–2:3", "Yohanes 3:16, 18".
export function formatReference(reference: BibleReference, short = false): string {
  const book = bookById(reference.book)
  const name = short ? book?.abbreviation : book?.name
  const parts: string[] = []
  let lastChapter: number | null = null
  for (const r of reference.ranges) {
    if (r.startVerse === null) {
      parts.push(r.endChapter === r.startChapter ? `${r.startChapter}` : `${r.startChapter}-${r.endChapter}`)
      continue
    }
    const start = r.startChapter === lastChapter ? `${r.startVerse}` : `${r.startChapter}:${r.startVerse}`
    let end = ''
    if (r.endChapter !== r.startChapter) end = `-${r.endChapter}:${r.endVerse}`
    else if (r.endVerse !== r.startVerse) end = `-${r.endVerse}`
    parts.push(start + end)
    lastChapter = r.endChapter
  }
  return `${name ?? '?'} ${parts.join(', ')}`
}

export function verseLabel(book: number, chapter: number, verse: number, short = true): string {
  const b = bookById(book)
  return `${short ? b?.abbreviation : b?.name} ${chapter}:${verse}`
}
