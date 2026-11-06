import { describe, expect, it } from 'vitest'
import { BIBLE_BOOKS, findBooks } from './books'
import { formatReference, parseReference, type BibleReference } from './reference'

const ok = (input: string): BibleReference => {
  const result = parseReference(input)
  if (!result.ok) throw new Error(`${input}: ${result.error}`)
  return result.reference
}

describe('books', () => {
  it('has the 66 books in order', () => {
    expect(BIBLE_BOOKS).toHaveLength(66)
    expect(BIBLE_BOOKS[0].name).toBe('Kejadian')
    expect(BIBLE_BOOKS[42].name).toBe('Yohanes')
    expect(BIBLE_BOOKS[65].name).toBe('Wahyu')
  })

  it.each([
    ['yoh', 'Yohanes'],
    ['Yohanes', 'Yohanes'],
    ['john', 'Yohanes'],
    ['1yoh', '1 Yohanes'],
    ['1 kor', '1 Korintus'],
    ['1cor', '1 Korintus'],
    ['mzm', 'Mazmur'],
    ['psalm', 'Mazmur'],
    ['kpr', 'Kisah Para Rasul'],
    ['kisah para', 'Kisah Para Rasul'],
    ['hakim-hakim', 'Hakim-hakim'],
    ['fil', 'Filipi'],
    ['flm', 'Filemon'],
    ['why', 'Wahyu'],
    ['yeh', 'Yehezkiel'],
    ['yes', 'Yesaya']
  ])('finds %s', (input, name) => {
    expect(findBooks(input).map((b) => b.name)).toEqual([name])
  })

  it('maps every TB abbreviation, OSIS code, and full name to its own book', () => {
    for (const book of BIBLE_BOOKS) {
      for (const key of [book.abbreviation, book.osis, book.name, book.english]) {
        expect(
          findBooks(key).map((b) => b.id),
          `${key} → ${book.name}`
        ).toEqual([book.id])
      }
    }
  })

  it('returns several books for an ambiguous prefix', () => {
    expect(findBooks('ye').map((b) => b.name)).toEqual(['Yesaya', 'Yeremia', 'Yehezkiel'])
  })
})

describe('parseReference', () => {
  it('reads a verse range', () => {
    expect(ok('yoh 3:16-18')).toEqual({
      book: 43,
      ranges: [{ startChapter: 3, startVerse: 16, endChapter: 3, endVerse: 18 }]
    })
  })

  it('reads a whole chapter and a chapter range', () => {
    expect(ok('mzm 23').ranges).toEqual([{ startChapter: 23, startVerse: null, endChapter: 23, endVerse: null }])
    expect(ok('mzm 23-24').ranges).toEqual([{ startChapter: 23, startVerse: null, endChapter: 24, endVerse: null }])
  })

  it.each(['1kor13:4', '1 kor 13:4', '1 Korintus 13 4', '1kor 13.4', '1 cor 13:4'])('reads %s', (input) => {
    expect(ok(input)).toEqual({ book: 46, ranges: [{ startChapter: 13, startVerse: 4, endChapter: 13, endVerse: 4 }] })
  })

  it('reads lists and ranges across chapters', () => {
    expect(ok('yoh 3:16, 18-20').ranges).toEqual([
      { startChapter: 3, startVerse: 16, endChapter: 3, endVerse: 16 },
      { startChapter: 3, startVerse: 18, endChapter: 3, endVerse: 20 }
    ])
    expect(ok('kej 1:31–2:3').ranges).toEqual([{ startChapter: 1, startVerse: 31, endChapter: 2, endVerse: 3 }])
  })

  it('explains what is wrong', () => {
    expect(parseReference('')).toMatchObject({ ok: false })
    expect(parseReference('xyz 1:1')).toMatchObject({ ok: false, error: 'Kitab "xyz" tidak dikenal.' })
    expect(parseReference('yoh')).toMatchObject({ ok: false, error: 'Ketik pasal, contoh: Yoh 1' })
    expect(parseReference('yoh 3:18-16')).toMatchObject({ ok: false })
    expect(parseReference('yoh 0:1')).toMatchObject({ ok: false })
  })

  it('suggests books for an ambiguous name', () => {
    const result = parseReference('ye 1:1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.suggestions.map((b) => b.abbreviation)).toEqual(['Yes', 'Yer', 'Yeh'])
  })
})

describe('formatReference', () => {
  it.each([
    ['yoh 3:16-18', 'Yohanes 3:16-18'],
    ['mzm 23', 'Mazmur 23'],
    ['kej 1:31-2:3', 'Kejadian 1:31-2:3'],
    ['yoh 3:16,18', 'Yohanes 3:16, 18'],
    ['1kor 13:4', '1 Korintus 13:4']
  ])('formats %s as %s', (input, label) => {
    expect(formatReference(ok(input))).toBe(label)
  })

  it('has a short form', () => {
    expect(formatReference(ok('yoh 3:16'), true)).toBe('Yoh 3:16')
  })
})
