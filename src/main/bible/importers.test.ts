import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cleanAbbreviation, parseBibleXml, readBibleFile } from './importers'

const fixtures = join(__dirname, '../../../tests/fixtures/bible')

describe('readBibleFile', () => {
  it('reads Zefania XML, skipping footnotes and books outside the canon', async () => {
    const bible = await readBibleFile(join(fixtures, 'kjv-zefania.xml'))
    expect(bible).toMatchObject({
      format: 'zefania',
      name: 'King James Version',
      abbreviation: 'KJV',
      language: 'ENG',
      license: 'Public Domain',
      skippedBooks: 1
    })
    expect(bible.verses).toHaveLength(7)
    expect(bible.verses[2]).toEqual({
      book: 1,
      chapter: 1,
      verse: 3,
      text: 'And God said, Let there be light: and there was light.'
    })
    expect(bible.verses.find((v) => v.book === 19)?.text).toBe('The LORD is my shepherd; I shall not want.')
  })

  it('reads OSIS with milestone and container verses, skipping headings and notes', async () => {
    const bible = await readBibleFile(join(fixtures, 'kjv-osis-milestone.xml'))
    expect(bible).toMatchObject({ format: 'osis', name: 'King James Version', abbreviation: 'KJV', skippedBooks: 1 })
    expect(bible.verses.map((v) => `${v.book}:${v.chapter}:${v.verse}`)).toEqual([
      '1:1:1',
      '1:1:2',
      '1:1:3',
      '43:3:16',
      '43:3:17'
    ])
    expect(bible.verses[0].text).toBe('In the beginning God created the heaven and the earth.')
    expect(bible.verses[2].text).toBe('And God said, Let there be light: and there was light.')
  })

  it('reads OpenSong, matching Indonesian or English book names', async () => {
    const bible = await readBibleFile(join(fixtures, 'kjv-opensong.xml'))
    expect(bible.format).toBe('opensong')
    expect(bible.name).toBe('kjv-opensong')
    expect(bible.verses.map((v) => v.book)).toEqual([1, 1, 1, 43, 43])
  })
})

describe('parseBibleXml', () => {
  it('rejects unknown formats and files without verses', () => {
    expect(() => parseBibleXml('<songs><song/></songs>')).toThrow('Format file tidak dikenali')
    expect(() => parseBibleXml('<XMLBIBLE></XMLBIBLE>')).toThrow('Tidak ada ayat')
  })

  it('rejects broken XML', () => {
    expect(() => parseBibleXml('<XMLBIBLE><BIBLEBOOK bnumber="1">')).toThrow()
  })

  it('handles a byte order mark', () => {
    const xml =
      '\uFEFF<bible><b n="Kejadian"><c n="1"><v n="1">Pada mulanya Allah menciptakan langit dan bumi.</v></c></b></bible>'
    expect(parseBibleXml(xml, 'Contoh').verses).toHaveLength(1)
  })
})

describe('cleanAbbreviation', () => {
  it('keeps letters and digits in capitals', () => {
    expect(cleanAbbreviation('tb-2')).toBe('TB2')
    expect(cleanAbbreviation('  ')).toBe('')
  })
})
