import { describe, expect, it } from 'vitest'
import { clearOverlay, fitScale, INITIAL_LIVE_STATE, showSlide, slideLines, toggleOverlay, type Slide } from './live'

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
