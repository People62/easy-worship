import { isHexColor, normalizeHex } from './color'
import { DEFAULT_LANGUAGE, isLanguage, t, type Language } from './i18n'
import { DEFAULT_LINES_PER_SLIDE, MAX_LINES_PER_SLIDE, MIN_LINES_PER_SLIDE } from './slides'

export type ThemeMode = 'dark' | 'light' | 'system'

export interface AppSettings {
  general: {
    // Language of the operator window and messages. Slides are not translated.
    language: Language
  }
  appearance: {
    mode: ThemeMode
    primary: string
  }
  output: {
    // Electron display id of the TV, or null to pick the first external display.
    displayId: number | null
    // Window mode (PRD F-OT-03): output in a normal window, for testing
    // without a projector.
    windowed: boolean
  }
  church: {
    // File name of the church logo inside the app's user data folder.
    logoFile: string | null
  }
  songs: {
    // Lines of lyrics per slide before a part is split over more slides.
    linesPerSlide: number
  }
  bible: {
    // The translation used for lookups, or null for the first one.
    versionId: number | null
  }
  // Default theme for each kind of slide, or null for the first of that kind.
  themes: {
    song: number | null
    bible: number | null
    text: number | null
  }
  // Panel sizes in the operator window, set by dragging the dividers.
  layout: {
    // Width of the Schedule column, in pixels.
    scheduleWidth: number
    // Part of the remaining width that goes to Preview (the rest is Live).
    previewShare: number
    // Height of the Library, in pixels.
    libraryHeight: number
  }
}

export type SettingsPatch = {
  general?: Partial<AppSettings['general']>
  appearance?: Partial<AppSettings['appearance']>
  output?: Partial<AppSettings['output']>
  church?: Partial<AppSettings['church']>
  songs?: Partial<AppSettings['songs']>
  bible?: Partial<AppSettings['bible']>
  themes?: Partial<AppSettings['themes']>
  layout?: Partial<AppSettings['layout']>
}

export const DEFAULT_PRIMARY = '#D4A017'

export const DEFAULT_SETTINGS: AppSettings = {
  general: { language: DEFAULT_LANGUAGE },
  appearance: { mode: 'dark', primary: DEFAULT_PRIMARY },
  output: { displayId: null, windowed: false },
  church: { logoFile: null },
  songs: { linesPerSlide: DEFAULT_LINES_PER_SLIDE },
  bible: { versionId: null },
  themes: { song: null, bible: null, text: null },
  layout: { scheduleWidth: 260, previewShare: 0.5, libraryHeight: 280 }
}

export const LAYOUT_LIMITS: Record<keyof AppSettings['layout'], { min: number; max: number }> = {
  scheduleWidth: { min: 180, max: 560 },
  previewShare: { min: 0.25, max: 0.75 },
  libraryHeight: { min: 160, max: 720 }
}

// Puts a panel size inside its limits. Sizes come from dragging, so they
// are clamped rather than rejected.
export function clampLayout(key: keyof AppSettings['layout'], value: number): number {
  const { min, max } = LAYOUT_LIMITS[key]
  const clamped = Math.min(max, Math.max(min, value))
  return key === 'previewShare' ? Math.round(clamped * 1000) / 1000 : Math.round(clamped)
}

const LAYOUT_KEYS = Object.keys(LAYOUT_LIMITS) as (keyof AppSettings['layout'])[]

export const PRIMARY_PRESETS: ReadonlyArray<{ name: string; value: string }> = [
  { name: 'Emas', value: '#D4A017' },
  { name: 'Biru', value: '#2563EB' },
  { name: 'Hijau', value: '#16A34A' },
  { name: 'Toska', value: '#0D9488' },
  { name: 'Ungu', value: '#7C3AED' },
  { name: 'Marun', value: '#9F1239' },
  { name: 'Oranye', value: '#EA580C' },
  { name: 'Abu', value: '#64748B' }
]

const THEME_MODES: readonly ThemeMode[] = ['dark', 'light', 'system']

function isThemeMode(value: unknown): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode)
}

function isDisplayId(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value))
}

// Only a bare file name such as "logo.png": no folders, so a damaged setting
// can never point outside the app's own folder.
export function isLogoFileName(value: unknown): value is string {
  return typeof value === 'string' && /^[\w-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value)
}

function isLogoFile(value: unknown): value is string | null {
  return value === null || isLogoFileName(value)
}

function isLinesPerSlide(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= MIN_LINES_PER_SLIDE && (value as number) <= MAX_LINES_PER_SLIDE
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

// Turns whatever is stored on disk into valid settings. Unknown keys are
// dropped and invalid values fall back to the defaults, so a damaged
// settings row can never stop the app from starting.
export function normalizeSettings(raw: unknown): AppSettings {
  const root = asRecord(raw)
  const general = asRecord(root.general)
  const appearance = asRecord(root.appearance)
  const output = asRecord(root.output)
  const church = asRecord(root.church)
  const songs = asRecord(root.songs)
  const bible = asRecord(root.bible)
  const themes = asRecord(root.themes)
  const layout = asRecord(root.layout)

  return {
    general: {
      language: isLanguage(general.language) ? general.language : DEFAULT_SETTINGS.general.language
    },
    appearance: {
      mode: isThemeMode(appearance.mode) ? appearance.mode : DEFAULT_SETTINGS.appearance.mode,
      primary: isHexColor(appearance.primary) ? normalizeHex(appearance.primary) : DEFAULT_SETTINGS.appearance.primary
    },
    output: {
      displayId: isDisplayId(output.displayId) ? output.displayId : DEFAULT_SETTINGS.output.displayId,
      windowed: typeof output.windowed === 'boolean' ? output.windowed : DEFAULT_SETTINGS.output.windowed
    },
    church: {
      logoFile: isLogoFile(church.logoFile) ? church.logoFile : DEFAULT_SETTINGS.church.logoFile
    },
    songs: {
      linesPerSlide: isLinesPerSlide(songs.linesPerSlide) ? songs.linesPerSlide : DEFAULT_SETTINGS.songs.linesPerSlide
    },
    bible: {
      versionId: isDisplayId(bible.versionId) ? bible.versionId : DEFAULT_SETTINGS.bible.versionId
    },
    themes: {
      song: isDisplayId(themes.song) ? themes.song : null,
      bible: isDisplayId(themes.bible) ? themes.bible : null,
      text: isDisplayId(themes.text) ? themes.text : null
    },
    layout: Object.fromEntries(
      LAYOUT_KEYS.map((key) => {
        const value = layout[key]
        return [key, Number.isFinite(value) ? clampLayout(key, value as number) : DEFAULT_SETTINGS.layout[key]]
      })
    ) as AppSettings['layout']
  }
}

// Applies a change from the UI. Unlike normalizeSettings, invalid values are
// rejected so the UI can show the mistake instead of silently resetting.
export function applySettingsPatch(current: AppSettings, patch: SettingsPatch): AppSettings {
  const next: AppSettings = {
    general: { ...current.general },
    appearance: { ...current.appearance },
    output: { ...current.output },
    church: { ...current.church },
    songs: { ...current.songs },
    bible: { ...current.bible },
    themes: { ...current.themes },
    layout: { ...current.layout }
  }

  if (patch.general?.language !== undefined) {
    if (!isLanguage(patch.general.language)) throw new Error(`Invalid language: ${String(patch.general.language)}`)
    next.general.language = patch.general.language
  }
  if (patch.appearance?.mode !== undefined) {
    if (!isThemeMode(patch.appearance.mode)) throw new Error(`Invalid theme mode: ${String(patch.appearance.mode)}`)
    next.appearance.mode = patch.appearance.mode
  }
  if (patch.appearance?.primary !== undefined) {
    if (!isHexColor(patch.appearance.primary)) throw new Error(`Invalid primary color: ${patch.appearance.primary}`)
    next.appearance.primary = normalizeHex(patch.appearance.primary)
  }
  if (patch.output?.displayId !== undefined) {
    if (!isDisplayId(patch.output.displayId)) throw new Error(`Invalid display id: ${String(patch.output.displayId)}`)
    next.output.displayId = patch.output.displayId
  }
  if (patch.output?.windowed !== undefined) {
    if (typeof patch.output.windowed !== 'boolean') throw new Error('Invalid window mode')
    next.output.windowed = patch.output.windowed
  }
  if (patch.church?.logoFile !== undefined) {
    if (!isLogoFile(patch.church.logoFile)) throw new Error(`Invalid logo file: ${String(patch.church.logoFile)}`)
    next.church.logoFile = patch.church.logoFile
  }
  if (patch.songs?.linesPerSlide !== undefined) {
    if (!isLinesPerSlide(patch.songs.linesPerSlide)) {
      throw new Error(t('Baris per slide harus {min}–{max}.', { min: MIN_LINES_PER_SLIDE, max: MAX_LINES_PER_SLIDE }))
    }
    next.songs.linesPerSlide = patch.songs.linesPerSlide
  }
  if (patch.bible?.versionId !== undefined) {
    if (!isDisplayId(patch.bible.versionId)) throw new Error(`Invalid bible version: ${String(patch.bible.versionId)}`)
    next.bible.versionId = patch.bible.versionId
  }
  for (const kind of ['song', 'bible', 'text'] as const) {
    const value = patch.themes?.[kind]
    if (value === undefined) continue
    if (!isDisplayId(value)) throw new Error(`Invalid theme: ${String(value)}`)
    next.themes[kind] = value
  }
  for (const key of LAYOUT_KEYS) {
    const value = patch.layout?.[key]
    if (value === undefined) continue
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid panel size: ${String(value)}`)
    next.layout[key] = clampLayout(key, value)
  }

  return next
}
