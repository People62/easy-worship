import { describe, expect, it } from 'vitest'
import {
  clearOverlay,
  findJump,
  fitScale,
  goToSlide,
  INITIAL_LIVE_STATE,
  showDeck,
  showSlide,
  slideLines,
  stepSlide,
  toggleOverlay,
  type LiveDeck,
  type Slide
} from './live'

const slide: Slide = { id: 's1', text: 'Bapa Engkau sungguh baik' }

describe('live state', () => {
  it('shows a slide and lifts any overlay', () => {
    const black = toggleOverlay(INITIAL_LIVE_STATE, 'black')
    const next = showSlide(black, slide)
    expect(next.slide).toBe(slide)
    expect(next.overlay).toBe('none')
  })

  it('toggles an overlay on and off', () => {
    const on = toggleOverlay(INITIAL_LIVE_STATE, 'logo')
    expect(on.overlay).toBe('logo')
    expect(toggleOverlay(on, 'logo').overlay).toBe('none')
  })

  it('switches directly from one overlay to another', () => {
    const black = toggleOverlay(INITIAL_LIVE_STATE, 'black')
    expect(toggleOverlay(black, 'clear').overlay).toBe('clear')
  })

  it('keeps the slide when an overlay is cleared', () => {
    const state = clearOverlay(toggleOverlay(showSlide(INITIAL_LIVE_STATE, slide), 'black'))
    expect(state).toMatchObject({ slide, overlay: 'none' })
  })

  it('never mutates the previous state', () => {
    const before = structuredClone(INITIAL_LIVE_STATE)
    showSlide(INITIAL_LIVE_STATE, slide)
    toggleOverlay(INITIAL_LIVE_STATE, 'black')
    expect(INITIAL_LIVE_STATE).toEqual(before)
  })
})

const deck: LiveDeck = {
  title: 'Bapa Engkau Sungguh Baik',
  slides: [
    { id: 'a', text: 'satu', jump: '1' },
    { id: 'b', text: 'dua' },
    { id: 'c', text: 'reff', jump: 'c' },
    { id: 'd', text: 'tiga', jump: '2' },
    { id: 'e', text: 'reff lagi', jump: 'c' }
  ]
}

describe('live deck', () => {
  it('shows a deck at the chosen slide and lifts any overlay', () => {
    const state = showDeck(toggleOverlay(INITIAL_LIVE_STATE, 'logo'), deck, 2)
    expect(state).toMatchObject({ index: 2, slide: { id: 'c' }, overlay: 'none', deck })
  })

  it('clamps the starting slide into the deck', () => {
    expect(showDeck(INITIAL_LIVE_STATE, deck, 99).index).toBe(4)
    expect(showDeck(INITIAL_LIVE_STATE, deck, -3).index).toBe(0)
  })

  it('treats an empty deck as clearing Live', () => {
    const state = showDeck(showDeck(INITIAL_LIVE_STATE, deck, 1), { title: 'x', slides: [] }, 0)
    expect(state).toMatchObject({ slide: null, deck: null })
  })

  it('steps forward and back and stops at both ends', () => {
    const first = showDeck(INITIAL_LIVE_STATE, deck, 0)
    expect(stepSlide(first, -1)).toBe(first)
    const second = stepSlide(first, 1)
    expect(second.slide?.id).toBe('b')
    const last = showDeck(INITIAL_LIVE_STATE, deck, 4)
    expect(stepSlide(last, 1)).toBe(last)
  })

  it('moving to a slide lifts Black, but staying put changes nothing', () => {
    const state = showDeck(INITIAL_LIVE_STATE, deck, 1)
    expect(goToSlide(state, 1)).toBe(state)
    const black = toggleOverlay(state, 'black')
    expect(goToSlide(black, 1).overlay).toBe('none')
  })

  it('does nothing without a deck', () => {
    expect(stepSlide(INITIAL_LIVE_STATE, 1)).toBe(INITIAL_LIVE_STATE)
    expect(goToSlide(INITIAL_LIVE_STATE, 2)).toBe(INITIAL_LIVE_STATE)
  })

  it('wraps a single slide in a deck so it can be shown the same way', () => {
    expect(showSlide(INITIAL_LIVE_STATE, slide).deck?.slides).toEqual([slide])
    expect(showSlide(INITIAL_LIVE_STATE, null).deck).toBeNull()
  })
})

describe('findJump', () => {
  it('finds the next part with the key, wrapping around', () => {
    expect(findJump(deck.slides, 'c', 0)).toBe(2)
    expect(findJump(deck.slides, 'C', 2)).toBe(4)
    expect(findJump(deck.slides, 'c', 4)).toBe(2)
    expect(findJump(deck.slides, '2', 0)).toBe(3)
  })

  it('returns -1 when the item has no such part', () => {
    expect(findJump(deck.slides, 'b', 0)).toBe(-1)
    expect(findJump([], 'c', 0)).toBe(-1)
  })
})

describe('slideLines', () => {
  it('trims lines and drops empty lines at the edges only', () => {
    expect(slideLines('\n  Baris satu \r\n\r\n Baris dua\n\n', false)).toEqual(['Baris satu', '', 'Baris dua'])
  })

  it('uses Indonesian upper case', () => {
    expect(slideLines('kusembah Engkau', true)).toEqual(['KUSEMBAH ENGKAU'])
  })

  it('returns no lines for blank text', () => {
    expect(slideLines('  \n ', true)).toEqual([])
  })
})

describe('fitScale', () => {
  it('fills a 16:9 box exactly', () => {
    expect(fitScale(1920, 1080)).toBe(1)
    expect(fitScale(960, 540)).toBe(0.5)
  })

  it('letterboxes other shapes', () => {
    expect(fitScale(1024, 768)).toBeCloseTo(1024 / 1920)
    expect(fitScale(1920, 800)).toBeCloseTo(800 / 1080)
  })

  it('returns 0 for an empty box', () => {
    expect(fitScale(0, 500)).toBe(0)
  })
})
