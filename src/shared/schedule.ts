import type { Slide, SlideStyle } from './live'
import { t } from './i18n'

// The order of service. Items point at songs, passages, and media in the
// library by id; announcements carry their own text. A schedule is saved as
// one JSON file with the extension .egw, and its name is the file name.

export type ScheduleItem =
  | { uid: string; kind: 'song'; songId: number; title: string }
  | {
      uid: string
      kind: 'bible'
      versionId: number
      // Used to find the same translation on another computer.
      abbreviation: string
      // "Yohanes 3:16-18", readable by parseReference.
      reference: string
      title: string
    }
  | { uid: string; kind: 'media'; mediaId: number; title: string }
  | { uid: string; kind: 'text'; title: string; body: string }

export type ScheduleItemKind = ScheduleItem['kind']

// An item before it is in a schedule (from the library or a drag).
export type NewScheduleItem = ScheduleItem extends infer T ? (T extends ScheduleItem ? Omit<T, 'uid'> : never) : never

export function scheduleKindLabel(kind: ScheduleItemKind): string {
  return { song: t('Lagu'), bible: t('Alkitab'), media: t('Media'), text: t('Teks') }[kind]
}

export const SCHEDULE_EXTENSION = 'egw'
export const SCHEDULE_FORMAT = 'el-gibbor-worship/schedule'
export const SCHEDULE_FILE_VERSION = 1
export const MAX_SCHEDULE_ITEMS = 300
export const MAX_TITLE_LENGTH = 200
export const MAX_TEXT_LENGTH = 10_000
export const MAX_SCHEDULE_FILE_BYTES = 5 * 1024 * 1024

export function newUid(): string {
  return crypto.randomUUID()
}

export function withUid(item: NewScheduleItem): ScheduleItem {
  return { ...item, uid: newUid() } as ScheduleItem
}

// Pure list edits. Each returns a new array and leaves the old one alone.

export function insertItem(items: ScheduleItem[], item: ScheduleItem, at: number): ScheduleItem[] {
  const index = Math.min(Math.max(0, at), items.length)
  return [...items.slice(0, index), item, ...items.slice(index)]
}

// Moves the item at `from` so it lands before the item that was at `to`
// (to = items.length moves it to the end). This is what a drop between two
// rows means.
export function moveItem(items: ScheduleItem[], from: number, to: number): ScheduleItem[] {
  if (from < 0 || from >= items.length) return items
  const target = Math.min(Math.max(0, to), items.length)
  if (target === from || target === from + 1) return items
  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(target > from ? target - 1 : target, 0, item!)
  return next
}

export function removeItem(items: ScheduleItem[], index: number): ScheduleItem[] {
  return index >= 0 && index < items.length ? items.filter((_, i) => i !== index) : items
}

// The copy goes right below the original.
export function duplicateItem(items: ScheduleItem[], index: number): ScheduleItem[] {
  const item = items[index]
  return item ? insertItem(items, { ...item, uid: newUid() }, index + 1) : items
}

// An announcement: a blank line starts a new slide.
export function textSlides(
  item: Pick<ScheduleItem & { kind: 'text' }, 'uid' | 'title' | 'body'>,
  style?: SlideStyle
): Slide[] {
  const parts = item.body
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part !== '')
  return parts.map((text, i) => ({
    id: `text:${item.uid}:${i}`,
    text,
    label: parts.length > 1 ? `${item.title} (${i + 1}/${parts.length})` : item.title,
    ...(style ? { style } : {})
  }))
}

// "C:\Ibadah\Minggu 12 Mei.egw" → "Minggu 12 Mei"
export function scheduleNameFromPath(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path
  return base.replace(/\.egw$/i, '') || 'Schedule'
}

// The item as stored in a file: without the id, which is only for the
// open schedule.
export function withoutUid(item: ScheduleItem): NewScheduleItem {
  const copy: Partial<ScheduleItem> = { ...item }
  delete copy.uid
  return copy as NewScheduleItem
}

export function serializeSchedule(items: ScheduleItem[], savedAt: Date = new Date()): string {
  const file = {
    format: SCHEDULE_FORMAT,
    version: SCHEDULE_FILE_VERSION,
    savedAt: savedAt.toISOString(),
    items: items.map(withoutUid)
  }
  return JSON.stringify(file, null, 2) + '\n'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed.slice(0, max)
}

function id(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) > 0 ? (value as number) : null
}

// Checks one item from a file or from the renderer. Returns null when it
// cannot be used.
export function parseScheduleItem(value: unknown): NewScheduleItem | null {
  const raw = asRecord(value)
  if (!raw) return null
  const title = text(raw.title, MAX_TITLE_LENGTH)
  if (!title) return null
  switch (raw.kind) {
    case 'song': {
      const songId = id(raw.songId)
      return songId ? { kind: 'song', songId, title } : null
    }
    case 'bible': {
      const versionId = id(raw.versionId)
      const reference = text(raw.reference, 100)
      const abbreviation = text(raw.abbreviation, 20) ?? ''
      return versionId && reference ? { kind: 'bible', versionId, abbreviation, reference, title } : null
    }
    case 'media': {
      const mediaId = id(raw.mediaId)
      return mediaId ? { kind: 'media', mediaId, title } : null
    }
    case 'text': {
      const body = typeof raw.body === 'string' ? raw.body.slice(0, MAX_TEXT_LENGTH) : null
      return body !== null ? { kind: 'text', title, body } : null
    }
    default:
      return null
  }
}

export interface ParsedSchedule {
  items: ScheduleItem[]
  // Items that were damaged or from a newer app, left out.
  skipped: number
}

// Reads a .egw file. Throws with a message for the operator when the file
// is not a schedule at all; single bad items are skipped and counted.
export function parseScheduleFile(content: string): ParsedSchedule {
  let data: unknown
  try {
    data = JSON.parse(content.replace(/^\uFEFF/, ''))
  } catch (error) {
    throw new Error(t('File schedule rusak atau bukan file .egw.'), { cause: error })
  }
  const root = asRecord(data)
  if (!root || root.format !== SCHEDULE_FORMAT || !Array.isArray(root.items)) {
    throw new Error(t('File ini bukan schedule El-Gibbor Worship.'))
  }
  if (typeof root.version !== 'number' || root.version > SCHEDULE_FILE_VERSION) {
    throw new Error(t('Schedule ini dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi dulu.'))
  }
  const items: ScheduleItem[] = []
  let skipped = 0
  for (const value of root.items.slice(0, MAX_SCHEDULE_ITEMS)) {
    const item = parseScheduleItem(value)
    if (item) items.push(withUid(item))
    else skipped++
  }
  skipped += Math.max(0, root.items.length - MAX_SCHEDULE_ITEMS)
  return { items, skipped }
}

// Checks a whole schedule sent by the renderer before it is written to disk.
export function validateScheduleItems(value: unknown): ScheduleItem[] {
  if (!Array.isArray(value)) throw new Error(t('Schedule tidak valid.'))
  if (value.length > MAX_SCHEDULE_ITEMS)
    throw new Error(t('Schedule maksimal {max} item.', { max: MAX_SCHEDULE_ITEMS }))
  return value.map((raw, index) => {
    const item = parseScheduleItem(raw)
    if (!item) throw new Error(t('Item ke-{n} tidak valid.', { n: index + 1 }))
    const uid = asRecord(raw)?.uid
    return { ...item, uid: typeof uid === 'string' && uid.length <= 64 ? uid : newUid() } as ScheduleItem
  })
}
