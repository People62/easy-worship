// What the congregation sees. The main process owns one LiveState and sends
// it to every window, so the Live panel and the TVs always show the same thing.

// The slide background. Image and video carry the media id (what is saved)
// and the URLs to show (filled in by the main process).
export type Background =
  | { kind: 'color'; color: string }
  | { kind: 'image'; mediaId: number; url: string }
  | { kind: 'video'; mediaId: number; url: string; posterUrl: string | null }

export interface Slide {
  id: string
  text: string
  // Short label for the operator, e.g. "Verse 1". Never shown on the TV.
  label?: string
  // Small line under the text on the TV, e.g. "Yohanes 3:16 (TB)".
  caption?: string
  // The theme style this slide is shown with. Without it the default is used.
  style?: SlideStyle
  // Key that jumps to this part of a song: "1"–"9" for verses, "c" chorus,
  // "b" bridge, "e" ending, "p" pre-chorus, "t" tag. Only the first slide of
  // each part of a song has it.
  jump?: string
}

// Everything that is on Live: all slides of one item (a song, a passage, an
// announcement), so the operator can move through them with one key.
export interface LiveDeck {
  title: string
  slides: Slide[]
  // The schedule item it came from, so the Schedule can mark it.
  source?: string
}

export interface SlideStyle {
  fontFamily: string
  // Sizes and margins are in pixels on the 1920×1080 canvas.
  fontSize: number
  lineHeight: number
  color: string
  uppercase: boolean
  align: 'left' | 'center' | 'right'
  shadow: boolean
  // Text outline; 0 = none.
  outlineWidth: number
  outlineColor: string
  // Space between the text and the edge of the screen.
  margin: number
  background: Background
  // Darkens an image or video behind the text so it stays readable (0–0.8).
  backgroundDim: number
}

// black: whole screen black. clear: hide the text, keep the background.
// logo: the church logo on black.
export type Overlay = 'none' | 'black' | 'clear' | 'logo'

export interface LiveState {
  // The slide on the TVs. When a deck is live, this is deck.slides[index].
  slide: Slide | null
  deck: LiveDeck | null
  index: number
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
  outlineWidth: 0,
  outlineColor: '#000000',
  margin: 120,
  background: { kind: 'color', color: '#000000' },
  backgroundDim: 0.35
}

export const INITIAL_LIVE_STATE: LiveState = {
  slide: null,
  deck: null,
  index: 0,
  style: DEFAULT_SLIDE_STYLE,
  overlay: 'none',
  logoUrl: null
}

// Showing a new slide always lifts Black, Clear, and Logo, so the operator
// never sends a slide that silently stays hidden.
export function showSlide(state: LiveState, slide: Slide | null): LiveState {
  return {
    ...state,
    slide,
    deck: slide ? { title: slide.label ?? '', slides: [slide] } : null,
    index: 0,
    overlay: 'none'
  }
}

export const MAX_DECK_SLIDES = 1000

// Puts a whole item on Live, starting at one of its slides.
export function showDeck(state: LiveState, deck: LiveDeck, index: number): LiveState {
  if (deck.slides.length === 0) return showSlide(state, null)
  const at = clampIndex(index, deck.slides.length)
  return { ...state, deck, index: at, slide: deck.slides[at]!, overlay: 'none' }
}

function clampIndex(index: number, length: number): number {
  return Math.min(Math.max(0, Math.trunc(index) || 0), Math.max(0, length - 1))
}

// Moves Live to another slide of the same item. Going past the first or
// last slide does nothing, so an extra press on the clicker never blanks
// the screen or jumps to another song.
export function goToSlide(state: LiveState, index: number): LiveState {
  if (!state.deck) return state
  const at = clampIndex(index, state.deck.slides.length)
  if (at === state.index && state.overlay === 'none') return state
  return { ...state, index: at, slide: state.deck.slides[at]!, overlay: 'none' }
}

export function stepSlide(state: LiveState, delta: number): LiveState {
  if (!state.deck) return state
  const target = state.index + delta
  if (target < 0 || target >= state.deck.slides.length) return state
  return goToSlide(state, target)
}

// Index of the next slide with this jump key after the current one,
// wrapping around, or -1 if the item has no such part.
export function findJump(slides: Slide[], key: string, from: number): number {
  const wanted = key.toLowerCase()
  const n = slides.length
  for (let step = 1; step <= n; step++) {
    const i = (from + step) % n
    if (slides[i]!.jump === wanted) return i
  }
  return -1
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
