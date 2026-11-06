// Color helpers for the operator UI: contrast checks (WCAG 2.x) and
// automatic adjustment of the user's primary color so it stays readable.

export type Rgb = { r: number; g: number; b: number }

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

export function parseHex(hex: string): Rgb {
  if (!isHexColor(hex)) throw new Error(`Invalid hex color: "${hex}"`)
  let digits = hex.slice(1)
  if (digits.length === 3) digits = [...digits].map((d) => d + d).join('')
  return {
    r: parseInt(digits.slice(0, 2), 16),
    g: parseInt(digits.slice(2, 4), 16),
    b: parseInt(digits.slice(4, 6), 16)
  }
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (n: number): string =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase()
}

export function normalizeHex(hex: string): string {
  return toHex(parseHex(hex))
}

export function relativeLuminance(hex: string): number {
  const channel = (value: number): number => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const { r, g, b } = parseHex(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Black or white, whichever reads better on the given background.
export function readableTextColor(background: string): '#000000' | '#FFFFFF' {
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#FFFFFF') ? '#000000' : '#FFFFFF'
}

function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount
  }
}

// Moves the color toward black (on light backgrounds) or white (on dark ones)
// in small steps until it reaches the minimum contrast ratio.
export function ensureContrast(color: string, background: string, minRatio: number): string {
  const start = normalizeHex(color)
  if (contrastRatio(start, background) >= minRatio) return start

  const target: Rgb = relativeLuminance(background) > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }
  const base = parseHex(start)
  for (let step = 1; step <= 20; step++) {
    const candidate = toHex(mix(base, target, step / 20))
    if (contrastRatio(candidate, background) >= minRatio) return candidate
  }
  return toHex(target)
}
