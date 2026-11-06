import { ensureContrast, readableTextColor } from '@shared/color'
import type { ThemeMode } from '@shared/settings'

export type ResolvedMode = 'dark' | 'light'

// Color tokens in two layers. Spacing, type, radius, and the component
// tokens live in styles.css; colors are set here because the primary color
// is chosen by the user and must be checked for contrast per mode.

// Layer 1, primitives: a warm stone scale that suits the gold brand color.
export const PALETTE = {
  stone950: '#12100E',
  stone900: '#1A1714',
  stone850: '#221E1A',
  stone800: '#2B2621',
  stone700: '#3B342D',
  stone600: '#57504A',
  stone500: '#7A726B',
  stone400: '#ABA49D',
  stone300: '#CFC9C1',
  stone200: '#E4DFD6',
  stone150: '#ECE8E0',
  stone100: '#F3F0EA',
  white: '#FFFFFF',
  cream: '#F5F0E6',
  ink: '#1C1917',
  inkMuted: '#655E58',
  red400: '#F87171',
  red600: '#DC2626',
  red700: '#B91C1C',
  green400: '#4ADE80',
  green800: '#166534',
  orange400: '#FB923C',
  orange800: '#9A3412'
} as const

// Layer 2, semantic: what each color is for, per mode.
const SEMANTIC: Record<ResolvedMode, Record<string, string>> = {
  dark: {
    '--bg': PALETTE.stone950,
    '--surface': PALETTE.stone900,
    '--surface-2': PALETTE.stone850,
    '--surface-hover': PALETTE.stone800,
    '--border': PALETTE.stone700,
    '--border-strong': PALETTE.stone600,
    '--fg': PALETTE.cream,
    '--muted': PALETTE.stone400,
    '--subtle': PALETTE.stone500,
    '--danger': PALETTE.red400,
    '--success': PALETTE.green400,
    '--warning': PALETTE.orange400
  },
  light: {
    '--bg': PALETTE.stone150,
    '--surface': PALETTE.white,
    '--surface-2': PALETTE.stone100,
    '--surface-hover': PALETTE.stone200,
    '--border': PALETTE.stone200,
    '--border-strong': PALETTE.stone300,
    '--fg': PALETTE.ink,
    '--muted': PALETTE.inkMuted,
    '--subtle': PALETTE.stone500,
    '--danger': PALETTE.red700,
    '--success': PALETTE.green800,
    '--warning': PALETTE.orange800
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
  const base = SEMANTIC[mode]
  const surface = base['--surface']
  const accent = ensureContrast(primary, surface, 3)
  return {
    ...base,
    '--primary': accent,
    '--primary-text': ensureContrast(primary, surface, 4.5),
    '--on-primary': readableTextColor(accent)
  }
}
