import { ensureContrast, readableTextColor } from '@shared/color'
import type { ThemeMode } from '@shared/settings'

export type ResolvedMode = 'dark' | 'light'

const BASE: Record<ResolvedMode, Record<string, string>> = {
  dark: {
    '--bg': '#171412',
    '--surface': '#26211D',
    '--surface-2': '#3A322B',
    '--border': '#3A322B',
    '--fg': '#F5F0E6',
    '--muted': '#A8A29E'
  },
  light: {
    '--bg': '#F7F5F0',
    '--surface': '#FFFFFF',
    '--surface-2': '#ECE8DF',
    '--border': '#E2DDD2',
    '--fg': '#1C1917',
    '--muted': '#6B645E'
  }
}

export function resolveMode(mode: ThemeMode, systemPrefersDark: boolean): ResolvedMode {
  if (mode === 'system') return systemPrefersDark ? 'dark' : 'light'
  return mode
}

// CSS variables for the operator window. The primary color is adjusted per
// mode so borders reach 3:1 and text reaches 4.5:1 against panels (WCAG),
// and text placed on the primary color is black or white, whichever reads.
export function themeVariables(mode: ResolvedMode, primary: string): Record<string, string> {
  const base = BASE[mode]
  const surface = base['--surface']
  const accent = ensureContrast(primary, surface, 3)
  return {
    ...base,
    '--primary': accent,
    '--primary-text': ensureContrast(primary, surface, 4.5),
    '--on-primary': readableTextColor(accent)
  }
}
