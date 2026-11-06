// Songs and their lyrics. Lyrics are edited as plain text with section
// markers such as [Verse 1] or [Reff], and stored as separate sections.

export const SECTION_KINDS = ['verse', 'pre-chorus', 'chorus', 'bridge', 'tag', 'ending', 'other'] as const
export type SectionKind = (typeof SECTION_KINDS)[number]

export interface SongSection {
  kind: SectionKind
  // 1 for "Verse 1"; null when the section has no number ("Chorus").
  number: number | null
  text: string
}

export interface SongInput {
  title: string
  author: string
  copyright: string
  ccli: string
  keywords: string
  sections: SongSection[]
}

export interface Song extends SongInput {
  id: number
  createdAt: string
  updatedAt: string
}

export interface SongSummary {
  id: number
  title: string
  author: string
  firstLine: string
}

const SECTION_LABELS: Record<SectionKind, string> = {
  verse: 'Verse',
  'pre-chorus': 'Pre-Chorus',
  chorus: 'Chorus',
  bridge: 'Bridge',
  tag: 'Tag',
  ending: 'Ending',
  other: 'Bagian'
}

// Marker words people use in Indonesian churches, mapped to a section kind.
const MARKER_ALIASES: Record<string, SectionKind> = {
  verse: 'verse',
  v: 'verse',
  bait: 'verse',
  ayat: 'verse',
  'pre-chorus': 'pre-chorus',
  prechorus: 'pre-chorus',
  'pre chorus': 'pre-chorus',
  'pre-reff': 'pre-chorus',
  'pre reff': 'pre-chorus',
  prereff: 'pre-chorus',
  chorus: 'chorus',
  c: 'chorus',
  reff: 'chorus',
  ref: 'chorus',
  refrain: 'chorus',
  korus: 'chorus',
  bridge: 'bridge',
  b: 'bridge',
  jembatan: 'bridge',
  tag: 'tag',
  coda: 'tag',
  ending: 'ending',
  end: 'ending',
  penutup: 'ending',
  outro: 'ending',
  other: 'other',
  bagian: 'other',
  intro: 'other'
}

export function sectionLabel(section: Pick<SongSection, 'kind' | 'number'>): string {
  const base = SECTION_LABELS[section.kind]
  return section.number === null ? base : `${base} ${section.number}`
}

// "[Verse 1]", "[Reff]", "[bait 2]", "[Pre-Chorus]" → kind and number.
export function parseMarker(line: string): Pick<SongSection, 'kind' | 'number'> | null {
  const match = /^\s*\[\s*([^\]]+?)\s*\]\s*$/.exec(line)
  if (!match) return null
  const words = match[1].toLowerCase().replace(/\s+/g, ' ')
  const numbered = /^(.*?)\s*(\d+)$/.exec(words)
  const name = (numbered ? numbered[1] : words).trim()
  const kind = MARKER_ALIASES[name]
  if (!kind) return null
  return { kind, number: numbered ? Number(numbered[2]) : null }
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}

// Turns the editor text into sections. Text before the first marker becomes
// "Verse 1". Unknown markers such as [Interlude] stay in the text as lyrics,
// so nothing the operator typed is ever lost.
export function parseLyrics(text: string): SongSection[] {
  const sections: SongSection[] = []
  let current: { kind: SectionKind; number: number | null; lines: string[] } | null = null

  const flush = (): void => {
    if (!current) return
    const body = normalizeText(current.lines.join('\n'))
    if (body) sections.push({ kind: current.kind, number: current.number, text: body })
  }

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const marker = parseMarker(line)
    if (marker) {
      flush()
      current = { ...marker, lines: [] }
    } else {
      current ??= { kind: 'verse', number: 1, lines: [] }
      current.lines.push(line)
    }
  }
  flush()
  return sections
}

// The opposite of parseLyrics, for opening a song in the editor.
export function formatLyrics(sections: SongSection[]): string {
  return sections.map((s) => `[${sectionLabel(s)}]\n${s.text}`).join('\n\n')
}

export function emptySongInput(): SongInput {
  return { title: '', author: '', copyright: '', ccli: '', keywords: '', sections: [] }
}

export function songFirstLine(sections: SongSection[]): string {
  const first = sections[0]?.text.split('\n').find((line) => line.trim() !== '')
  return first?.trim() ?? ''
}

// Checks a song before saving. Returns the cleaned song, or throws with a
// message the operator can read.
export function validateSongInput(input: unknown): SongInput {
  if (typeof input !== 'object' || input === null) throw new Error('Data lagu tidak valid.')
  const raw = input as Record<string, unknown>
  const text = (value: unknown, field: string, max: number): string => {
    if (value === undefined || value === null) return ''
    if (typeof value !== 'string') throw new Error(`Kolom ${field} tidak valid.`)
    const trimmed = value.trim()
    if (trimmed.length > max) throw new Error(`Kolom ${field} terlalu panjang (maksimal ${max} karakter).`)
    return trimmed
  }

  const title = text(raw.title, 'judul', 200)
  if (!title) throw new Error('Judul lagu wajib diisi.')

  if (!Array.isArray(raw.sections)) throw new Error('Lirik lagu tidak valid.')
  const sections = raw.sections.map((section, index): SongSection => {
    const s = (section ?? {}) as Record<string, unknown>
    if (!SECTION_KINDS.includes(s.kind as SectionKind)) throw new Error(`Jenis bagian ke-${index + 1} tidak valid.`)
    const number = s.number === null || s.number === undefined ? null : Number(s.number)
    if (number !== null && (!Number.isInteger(number) || number < 1 || number > 99)) {
      throw new Error(`Nomor bagian ke-${index + 1} tidak valid.`)
    }
    const body = normalizeText(text(s.text, 'lirik', 5000))
    return { kind: s.kind as SectionKind, number, text: body }
  })
  const nonEmpty = sections.filter((s) => s.text !== '')
  if (nonEmpty.length === 0) throw new Error('Lirik lagu masih kosong.')
  if (nonEmpty.length > 100) throw new Error('Lagu terlalu banyak bagian (maksimal 100).')

  return {
    title,
    author: text(raw.author, 'pengarang', 200),
    copyright: text(raw.copyright, 'hak cipta', 300),
    ccli: text(raw.ccli, 'CCLI', 20),
    keywords: text(raw.keywords, 'kata kunci', 500),
    sections: nonEmpty
  }
}
