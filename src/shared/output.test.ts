import { describe, expect, it } from 'vitest'
import type { DisplayInfo } from './ipc'
import { chooseOutput, describeOutput } from './output'

const laptop: DisplayInfo = { id: 1, label: 'Laptop (layar utama)', width: 1366, height: 768, isPrimary: true }
const hdmi: DisplayInfo = { id: 2, label: 'HDMI', width: 1920, height: 1080, isPrimary: false }
const second: DisplayInfo = { id: 3, label: 'Monitor 2', width: 1920, height: 1080, isPrimary: false }

describe('chooseOutput', () => {
  it('uses the external display when one is connected', () => {
    expect(chooseOutput([laptop, hdmi], { windowed: false, preferredDisplayId: null })).toEqual({
      state: 'fullscreen',
      display: hdmi
    })
  })

  it('never uses the laptop screen, even if it was chosen', () => {
    expect(chooseOutput([laptop], { windowed: false, preferredDisplayId: laptop.id })).toEqual({
      state: 'none',
      reason: 'no-external-display'
    })
    expect(chooseOutput([laptop, hdmi], { windowed: false, preferredDisplayId: laptop.id })).toMatchObject({
      display: hdmi
    })
  })

  it('uses the preferred external display when it is connected', () => {
    expect(chooseOutput([laptop, hdmi, second], { windowed: false, preferredDisplayId: 3 })).toMatchObject({
      display: second
    })
  })

  it('falls back to another external display when the preferred one is unplugged', () => {
    expect(chooseOutput([laptop, hdmi], { windowed: false, preferredDisplayId: 3 })).toMatchObject({ display: hdmi })
  })

  it('uses a window in window mode, with or without HDMI', () => {
    expect(chooseOutput([laptop], { windowed: true, preferredDisplayId: null })).toEqual({ state: 'windowed' })
    expect(chooseOutput([laptop, hdmi], { windowed: true, preferredDisplayId: 2 })).toEqual({ state: 'windowed' })
  })
})

describe('describeOutput', () => {
  it('tells the operator where the output is', () => {
    expect(describeOutput({ state: 'fullscreen', display: hdmi })).toBe('Output: HDMI · 1920×1080')
    expect(describeOutput({ state: 'none', reason: 'no-external-display' })).toBe('Output: tidak ada layar HDMI')
  })
})
