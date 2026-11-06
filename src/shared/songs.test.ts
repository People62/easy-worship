import { describe, expect, it } from 'vitest'
import { formatLyrics, parseLyrics, parseMarker, sectionLabel, songFirstLine, validateSongInput } from './songs'

describe('parseMarker', () => {
  it.each([
    ['[Verse 1]', 'verse', 1],
    ['[verse2]', 'verse', 2],
    ['[Bait 3]', 'verse', 3],
    ['[Reff]', 'chorus', null],
    ['[ Chorus ]', 'chorus', null],
    ['[Pre-Chorus]', 'pre-chorus', null],
    ['[Pre Reff]', 'pre-chorus', null],
    ['[Bridge]', 'bridge', null],
    ['[Ending]', 'ending', null],
    ['[Penutup]', 'ending', null]
  ])('reads %s', (line, kind, number) => {
    const result = parseMarker(line)
    if (kind === null) expect(result).toBeNull()
    else expect(result).toEqual({ kind, number })
  })

  it('ignores lines that are not markers', () => {
    expect(parseMarker('Bapa Engkau [sungguh] baik')).toBeNull()
    expect(parseMarker('[Interlude]')).toBeNull()
  })
})

describe('parseLyrics', () => {
  it('splits lyrics into sections', () => {
    const text = '[Verse 1]\nBapa Engkau sungguh baik\nKasih-Mu melimpah\n\n[Reff]\nKusembah Engkau\n'
    expect(parseLyrics(text)).toEqual([
      { kind: 'verse', number: 1, text: 'Bapa Engkau sungguh baik\nKasih-Mu melimpah' },
      { kind: 'chorus', number: null, text: 'Kusembah Engkau' }
    ])
  })

  it('treats text before any marker as verse 1', () => {
    expect(parseLyrics('Haleluya\nPuji Tuhan')).toEqual([{ kind: 'verse', number: 1, text: 'Haleluya\nPuji Tuhan' }])
  })

  it('keeps blank lines inside a section as slide breaks', () => {
    expect(parseLyrics('[Verse 1]\na\nb\n\nc\nd')[0].text).toBe('a\nb\n\nc\nd')
  })

  it('keeps unknown markers as lyrics and drops empty sections', () => {
    const sections = parseLyrics('[Verse 1]\n[Interlude]\nla la\n[Chorus]\n\n')
    expect(sections).toEqual([{ kind: 'verse', number: 1, text: '[Interlude]\nla la' }])
  })

  it('handles Windows line endings', () => {
    expect(parseLyrics('[Reff]\r\nSatu\r\nDua')[0].text).toBe('Satu\nDua')
  })

  it('round-trips through formatLyrics', () => {
    const sections = parseLyrics('[Verse 1]\nA\n\n[Chorus]\nB\n\n[Verse 2]\nC')
    expect(parseLyrics(formatLyrics(sections))).toEqual(sections)
    expect(formatLyrics(sections)).toBe('[Verse 1]\nA\n\n[Chorus]\nB\n\n[Verse 2]\nC')
  })
})

describe('labels and first line', () => {
  it('builds section labels', () => {
    expect(sectionLabel({ kind: 'verse', number: 2 })).toBe('Verse 2')
    expect(sectionLabel({ kind: 'chorus', number: null })).toBe('Chorus')
  })

  it('finds the first non-empty line', () => {
    expect(songFirstLine([{ kind: 'verse', number: 1, text: '\n  Bapa Engkau  \nx' }])).toBe('Bapa Engkau')
    expect(songFirstLine([])).toBe('')
  })
})

describe('validateSongInput', () => {
  const valid = {
    title: '  Bapa Engkau Sungguh Baik ',
    author: '',
    copyright: '',
    ccli: '',
    keywords: 'NKB 1',
    sections: [{ kind: 'verse', number: 1, text: 'Bapa Engkau sungguh baik' }]
  }

  it('trims and accepts a valid song', () => {
    expect(validateSongInput(valid).title).toBe('Bapa Engkau Sungguh Baik')
  })

  it('requires a title and lyrics', () => {
    expect(() => validateSongInput({ ...valid, title: ' ' })).toThrow('Judul lagu wajib diisi.')
    expect(() => validateSongInput({ ...valid, sections: [] })).toThrow('Lirik lagu masih kosong.')
    expect(() => validateSongInput({ ...valid, sections: [{ kind: 'verse', number: 1, text: '  ' }] })).toThrow(
      'Lirik lagu masih kosong.'
    )
  })

  it('rejects unknown section kinds and bad numbers', () => {
    expect(() => validateSongInput({ ...valid, sections: [{ kind: 'solo', number: 1, text: 'a' }] })).toThrow(
      'Jenis bagian'
    )
    expect(() => validateSongInput({ ...valid, sections: [{ kind: 'verse', number: 0, text: 'a' }] })).toThrow(
      'Nomor bagian'
    )
  })

  it('rejects very long fields', () => {
    expect(() => validateSongInput({ ...valid, title: 'x'.repeat(201) })).toThrow('terlalu panjang')
  })
})
