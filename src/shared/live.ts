// What the congregation sees. The main process owns one LiveState and sends
// it to every window, so the Live panel and the TVs always show the same thing.

export type Background = { kind: 'color'; color: string }

export interface Slide {
  id: string
  text: string
  // Short label for the operator, e.g. "Verse 1". Never shown on the TV.
  label?: string
  // Small line under the text on the TV, e.g. "Yohanes 3:16 (TB)".
  caption?: string
  // Per-slide overrides of the style: Bible text is not shown in capitals
  // and uses a slightly smaller font than song lyrics.
  uppercase?: boolean
  fontScale?: number
  background?: Background
}

export interface SlideStyle {
  fontFamily: string
  // Font size in pixels on the 1920×1080 canvas.
  fontSize: number
  lineHeight: number
  color: string
  uppercase: boolean
  align: 'left' | 'center' | 'right'
  shadow: boolean
  background: Background
}

// black: whole screen black. clear: hide the text, keep the background.
// logo: the church logo on black.
export type Overlay = 'none' | 'black' | 'clear' | 'logo'

export interface LiveState {
  slide: Slide | null
  style: SlideStyle
  overlay: Overlay
  logoUrl: string | null
}

export const CANVAS_WIDTH = 1920
export const CANVAS_HEIGHT = 1080

export const DEFAULT_SLIDE_STYLE: SlideStyle = {
  fontFamily: "'Segoe UI', 'Noto Sans', Arial, sans-serif",
  fontSize: 84,
  lineHeight: 1.25,
  color: '#FFFFFF',
  uppercase: true,
  align: 'center',
  shadow: true,
  background: { kind: 'color', color: '#000000' }
}

export const INITIAL_LIVE_STATE: LiveState = {
  slide: null,
  style: DEFAULT_SLIDE_STYLE,
  overlay: 'none',
  logoUrl: null
}

// Showing a new slide always lifts Black, Clear, and Logo, so the operator
// never sends a slide that silently stays hidden.
export function showSlide(state: LiveState, slide: Slide | null): LiveState {
  return { ...state, slide, overlay: 'none' }
}

// Pressing the same control twice turns it off again.
export function toggleOverlay(state: LiveState, overlay: Exclude<Overlay, 'none'>): LiveState {
  return { ...state, overlay: state.overlay === overlay ? 'none' : overlay }
}

export function clearOverlay(state: LiveState): LiveState {
  return { ...state, overlay: 'none' }
}

export function setLogo(state: LiveState, logoUrl: string | null): LiveState {
  return { ...state, logoUrl }
}

// Splits text for display: trims each line and drops empty lines at the edges.
export function slideLines(text: string, uppercase: boolean): string[] {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
  while (lines.length > 0 && lines[0] === '') lines.shift()
  while (lines.length > 0 && lines.at(-1) === '') lines.pop()
  return uppercase ? lines.map((line) => line.toLocaleUpperCase('id-ID')) : lines
}

// Scale that fits the 1920×1080 canvas inside a box, keeping 16:9.
export function fitScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0
  return Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT)
}
