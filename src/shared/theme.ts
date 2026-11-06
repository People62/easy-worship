import { isHexColor, normalizeHex } from './color'
import { DEFAULT_SLIDE_STYLE, type Background, type SlideStyle } from './live'

export type ThemeKind = 'song' | 'bible' | 'text'
export const THEME_KINDS: readonly ThemeKind[] = ['song', 'bible', 'text']

export const THEME_KIND_LABELS: Record<ThemeKind, string> = {
  song: 'Lagu',
  bible: 'Alkitab',
  text: 'Teks bebas'
}

export interface Theme {
  id: number
  name: string
  kind: ThemeKind
  style: SlideStyle
}

export interface ThemeInput {
  name: string
  kind: ThemeKind
  style: SlideStyle
}

// Fonts that ship with Windows 10 and 11, so a theme never falls back to an
// unexpected font on the church laptop.
export const FONT_CHOICES: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Segoe UI', value: "'Segoe UI', 'Noto Sans', Arial, sans-serif" },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Arial Black', value: "'Arial Black', Arial, sans-serif" },
  { label: 'Calibri', value: "Calibri, 'Segoe UI', sans-serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Cambria', value: 'Cambria, Georgia, serif' }
]

export const LIMITS = {
  fontSize: { min: 32, max: 160 },
  lineHeight: { min: 0.9, max: 2 },
  outlineWidth: { min: 0, max: 12 },
  margin: { min: 40, max: 320 },
  backgroundDim: { min: 0, max: 0.8 }
} as const

export const DEFAULT_THEMES: Record<ThemeKind, ThemeInput> = {
  song: { name: 'Lagu · Standar', kind: 'song', style: DEFAULT_SLIDE_STYLE },
  bible: {
    name: 'Alkitab · Standar',
    kind: 'bible',
    style: { ...DEFAULT_SLIDE_STYLE, fontSize: 68, uppercase: false, lineHeight: 1.3 }
  },
  text: { name: 'Teks · Standar', kind: 'text', style: { ...DEFAULT_SLIDE_STYLE, fontSize: 72, uppercase: false } }
}

function clamp(value: unknown, limits: { min: number; max: number }, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(limits.max, Math.max(limits.min, n))
}

function color(value: unknown, fallback: string): string {
  return isHexColor(value) ? normalizeHex(value) : fallback
}

// Font names may only contain letters, digits, spaces, quotes, commas, and
// hyphens, so a theme can never inject other CSS.
function fontFamily(value: unknown): string {
  return typeof value === 'string' && /^[\w\s'",-]{1,120}$/.test(value) ? value : DEFAULT_SLIDE_STYLE.fontFamily
}

// The stored form of a background: only the media id, never a URL.
export type StoredBackground = { kind: 'color'; color: string } | { kind: 'image' | 'video'; mediaId: number }

export function storedBackground(value: unknown): StoredBackground {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  if ((raw.kind === 'image' || raw.kind === 'video') && Number.isInteger(raw.mediaId) && (raw.mediaId as number) > 0) {
    return { kind: raw.kind, mediaId: raw.mediaId as number }
  }
  return { kind: 'color', color: color(raw.color, '#000000') }
}

// Cleans a style from the database or the editor. Every field falls back to
// the default, so a damaged theme can never stop a slide from showing.
// Media backgrounds are resolved separately (see resolveBackground).
export function normalizeStyle(value: unknown, fallback: SlideStyle = DEFAULT_SLIDE_STYLE): SlideStyle {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const bg = storedBackground(raw.background)
  return {
    fontFamily: raw.fontFamily === undefined ? fallback.fontFamily : fontFamily(raw.fontFamily),
    fontSize: Math.round(clamp(raw.fontSize, LIMITS.fontSize, fallback.fontSize)),
    lineHeight: Math.round(clamp(raw.lineHeight, LIMITS.lineHeight, fallback.lineHeight) * 100) / 100,
    color: color(raw.color, fallback.color),
    uppercase: typeof raw.uppercase === 'boolean' ? raw.uppercase : fallback.uppercase,
    align: raw.align === 'left' || raw.align === 'right' || raw.align === 'center' ? raw.align : fallback.align,
    shadow: typeof raw.shadow === 'boolean' ? raw.shadow : fallback.shadow,
    outlineWidth: Math.round(clamp(raw.outlineWidth, LIMITS.outlineWidth, fallback.outlineWidth)),
    outlineColor: color(raw.outlineColor, fallback.outlineColor),
    margin: Math.round(clamp(raw.margin, LIMITS.margin, fallback.margin)),
    background:
      bg.kind === 'color'
        ? bg
        : bg.kind === 'image'
          ? { kind: 'image', mediaId: bg.mediaId, url: '' }
          : { kind: 'video', mediaId: bg.mediaId, url: '', posterUrl: null },
    backgroundDim: Math.round(clamp(raw.backgroundDim, LIMITS.backgroundDim, fallback.backgroundDim) * 100) / 100
  }
}

export interface MediaRef {
  id: number
  kind: 'image' | 'video'
  url: string
  thumbnailUrl: string | null
}

// Fills in the URLs of a media background. If the media file was deleted,
// the background falls back to black so the slide still shows.
export function resolveBackground(background: Background, findMedia: (id: number) => MediaRef | null): Background {
  if (background.kind === 'color') return background
  const media = findMedia(background.mediaId)
  if (!media || media.kind !== background.kind) return { kind: 'color', color: '#000000' }
  return media.kind === 'image'
    ? { kind: 'image', mediaId: media.id, url: media.url }
    : { kind: 'video', mediaId: media.id, url: media.url, posterUrl: media.thumbnailUrl }
}

export function validateThemeInput(input: unknown): ThemeInput {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 100) : ''
  if (!name) throw new Error('Nama tema wajib diisi.')
  if (!THEME_KINDS.includes(raw.kind as ThemeKind)) throw new Error('Jenis tema tidak valid.')
  const kind = raw.kind as ThemeKind
  return { name, kind, style: normalizeStyle(raw.style, DEFAULT_THEMES[kind].style) }
}
