import type { Display } from 'electron'
import { describe, expect, it } from 'vitest'
import { toDisplayInfo } from './displays'

const display = (id: number, label: string, width = 1920, height = 1080): Display =>
  ({ id, label, size: { width, height } }) as Display

describe('toDisplayInfo', () => {
  it('marks the primary display', () => {
    expect(toDisplayInfo(display(1, 'Built-in'), 1, 0)).toEqual({
      id: 1,
      label: 'Built-in (layar utama)',
      width: 1920,
      height: 1080,
      isPrimary: true
    })
  })

  it('names unlabeled displays by position', () => {
    expect(toDisplayInfo(display(9, '  '), 1, 1).label).toBe('Layar 2')
  })
})
