import { readFile, stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { SaxesParser, type SaxesTagPlain } from 'saxes'
import { bookById, bookByOsis, findBooks } from '@shared/bible/books'
import type { BibleVerse } from '@shared/bible/slides'

export type BibleFormat = 'zefania' | 'osis' | 'opensong'

export interface ImportedBible {
  format: BibleFormat
  name: string
  abbreviation: string
  language: string
  license: string
  verses: BibleVerse[]
  // Books outside the 66-book canon (for example Tobit) that were left out.
  skippedBooks: number
}

const MAX_FILE_BYTES = 100 * 1024 * 1024

// Elements whose text is not part of the verse: footnotes, cross references,
// section headings, and alternative readings.
const SKIP_IN_VERSE = new Set(['note', 'title', 'rdg', 'reference', 'xref', 'br'])

export function cleanAbbreviation(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 12)
}

function attr(node: SaxesTagPlain, name: string): string | undefined {
  const value = node.attributes[name]
  return typeof value === 'string' ? value : undefined
}

function positiveInt(value: string | undefined): number | null {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

// Parses a Bible XML file in Zefania, OSIS, or OpenSong format. The format is
// detected from the root element, so the file name does not matter.
export function parseBibleXml(xml: string, fallbackName = 'Alkitab'): ImportedBible {
  const parser = new SaxesParser({ xmlns: false })
  const verses: BibleVerse[] = []
  const meta = { name: '', abbreviation: '', language: '', license: '' }
  const skippedBookKeys = new Set<string>()

  let format: BibleFormat | null = null
  let book: number | null = null
  let chapter: number | null = null
  let openSongBookIndex = 0

  // The verse being read. OSIS "milestone" verses have no closing element:
  // the text between <verse sID/> and <verse eID/> belongs to the verse.
  let current: { book: number; chapter: number; verse: number; parts: string[] } | null = null
  let skipDepth = 0
  const path: string[] = []
  let metaField: keyof typeof meta | null = null

  const finishVerse = (): void => {
    if (!current) return
    const text = current.parts.join('').replace(/\s+/g, ' ').trim()
    if (text) verses.push({ book: current.book, chapter: current.chapter, verse: current.verse, text })
    current = null
  }

  parser.on('opentag', (node) => {
    const name = node.name.toLowerCase().replace(/^.*:/, '')
    path.push(name)

    if (path.length === 1) {
      if (name === 'xmlbible') format = 'zefania'
      else if (name === 'osis') format = 'osis'
      else if (name === 'bible') format = 'opensong'
      else throw new Error('Format file tidak dikenali. Gunakan Zefania XML, OSIS, atau OpenSong.')
      if (format === 'zefania') meta.name = attr(node, 'biblename') ?? ''
      return
    }

    if (current && SKIP_IN_VERSE.has(name)) {
      skipDepth++
      return
    }
    if (skipDepth > 0) {
      skipDepth++
      return
    }

    if (format === 'zefania') {
      if (path.includes('information')) {
        if (name === 'title' || name === 'identifier' || name === 'language' || name === 'rights') {
          metaField =
            name === 'title'
              ? 'name'
              : name === 'identifier'
                ? 'abbreviation'
                : name === 'rights'
                  ? 'license'
                  : 'language'
        }
      } else if (name === 'biblebook') {
        const number = positiveInt(attr(node, 'bnumber'))
        const byName = findBooks(attr(node, 'bname') ?? '')
        book = number !== null ? (bookById(number)?.id ?? null) : byName.length === 1 ? byName[0].id : null
        if (book === null) skippedBookKeys.add(attr(node, 'bnumber') ?? attr(node, 'bname') ?? '?')
      } else if (name === 'chapter') {
        chapter = positiveInt(attr(node, 'cnumber'))
      } else if (name === 'vers' && book !== null && chapter !== null) {
        const verse = positiveInt(attr(node, 'vnumber'))
        if (verse !== null) current = { book, chapter, verse, parts: [] }
      }
    } else if (format === 'osis') {
      if (path.includes('header') && path.includes('work')) {
        if (name === 'title') metaField = 'name'
        if (name === 'language') metaField = 'language'
        if (name === 'rights') metaField = 'license'
      } else if (name === 'osistext') {
        meta.abbreviation = attr(node, 'osisIDWork') ?? ''
        meta.language = attr(node, 'xml:lang') ?? ''
      } else if (name === 'div' && attr(node, 'type') === 'book') {
        const code = attr(node, 'osisID') ?? ''
        book = bookByOsis(code)?.id ?? null
        if (book === null) skippedBookKeys.add(code)
      } else if (name === 'verse') {
        const eID = attr(node, 'eID')
        if (eID) {
          finishVerse()
          return
        }
        // osisID "John.3.16" (may hold several ids; the first one counts).
        const id = (attr(node, 'sID') ?? attr(node, 'osisID') ?? '').split(/\s+/)[0]
        const [code, c, v] = id.split('.')
        const verseBook = bookByOsis(code ?? '')?.id ?? null
        const ch = positiveInt(c)
        const vn = positiveInt(v)
        finishVerse()
        if (verseBook !== null && ch !== null && vn !== null)
          current = { book: verseBook, chapter: ch, verse: vn, parts: [] }
      }
    } else if (format === 'opensong') {
      if (name === 'b') {
        openSongBookIndex++
        const byName = findBooks(attr(node, 'n') ?? '')
        book = byName.length === 1 ? byName[0].id : (bookById(openSongBookIndex)?.id ?? null)
        if (book === null) skippedBookKeys.add(attr(node, 'n') ?? `${openSongBookIndex}`)
      } else if (name === 'c') {
        chapter = positiveInt(attr(node, 'n'))
      } else if (name === 'v' && book !== null && chapter !== null) {
        const verse = positiveInt(attr(node, 'n'))
        if (verse !== null) current = { book, chapter, verse, parts: [] }
      }
    }
  })

  parser.on('text', (text) => {
    if (skipDepth > 0) return
    if (current) current.parts.push(text)
    else if (metaField && !meta[metaField]) meta[metaField] = text.trim()
  })

  parser.on('closetag', (node) => {
    const name = node.name.toLowerCase().replace(/^.*:/, '')
    path.pop()
    if (skipDepth > 0) {
      skipDepth--
      return
    }
    metaField = null
    // Container verses end with their closing tag; OSIS milestones end at eID.
    // A self-closing <verse sID/> is a milestone start, not the end of a verse.
    const isVerseEnd = name === 'vers' || name === 'v' || (name === 'verse' && !node.isSelfClosing)
    if (isVerseEnd && current) finishVerse()
    if (name === 'biblebook' || name === 'b' || (name === 'div' && format === 'osis')) {
      finishVerse()
      book = null
    }
  })

  parser.write(xml.replace(/^\uFEFF/, '')).close()
  finishVerse()

  if (!format) throw new Error('File kosong atau bukan XML.')
  if (verses.length === 0) throw new Error('Tidak ada ayat yang terbaca dari file ini.')

  const name = meta.name || fallbackName
  return {
    format,
    name,
    abbreviation:
      cleanAbbreviation(meta.abbreviation) ||
      cleanAbbreviation(
        name
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
      ) ||
      'ALKITAB',
    language: meta.language.slice(0, 20),
    license: meta.license.slice(0, 300),
    verses,
    skippedBooks: skippedBookKeys.size
  }
}

export async function readBibleFile(path: string): Promise<ImportedBible> {
  const info = await stat(path)
  if (info.size > MAX_FILE_BYTES) throw new Error('File terlalu besar (maksimal 100 MB).')
  const xml = await readFile(path, 'utf8')
  try {
    return parseBibleXml(xml, basename(path, extname(path)))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // saxes reports XML syntax errors as "line:column: message".
    throw new Error(/^\d+:\d+: /.test(message) ? `File XML rusak (${message}).` : message, { cause: error })
  }
}
