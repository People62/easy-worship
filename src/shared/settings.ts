import { isHexColor, normalizeHex } from './color'

export type ThemeMode = 'dark' | 'light' | 'system'

export interface AppSettings {
  appearance: {
    mode: ThemeMode
    primary: string
  }
  output: {
    // Electron display id of the projector/TV, or null to ask the operator.
    displayId: number | null
  }
}

export type SettingsPatch = {
  appearance?: Partial<AppSettings['appearance']>
  output?: Partial<AppSettings['output']>
}

export const DEFAULT_PRIMARY = '#D4A017'

export const DEFAULT_SETTINGS: AppSettings = {
  appearance: { mode: 'dark', primary: DEFAULT_PRIMARY },
  output: { displayId: null }
}

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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

// Turns whatever is stored on disk into valid settings. Unknown keys are
// dropped and invalid values fall back to the defaults, so a damaged
// settings row can never stop the app from starting.
export function normalizeSettings(raw: unknown): AppSettings {
  const root = asRecord(raw)
  const appearance = asRecord(root.appearance)
  const output = asRecord(root.output)

  return {
    appearance: {
      mode: isThemeMode(appearance.mode) ? appearance.mode : DEFAULT_SETTINGS.appearance.mode,
      primary: isHexColor(appearance.primary) ? normalizeHex(appearance.primary) : DEFAULT_SETTINGS.appearance.primary
    },
    output: {
      displayId: isDisplayId(output.displayId) ? output.displayId : DEFAULT_SETTINGS.output.displayId
    }
  }
}

// Applies a change from the UI. Unlike normalizeSettings, invalid values are
// rejected so the UI can show the mistake instead of silently resetting.
export function applySettingsPatch(current: AppSettings, patch: SettingsPatch): AppSettings {
  const next: AppSettings = {
    appearance: { ...current.appearance },
    output: { ...current.output }
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

  return next
}
