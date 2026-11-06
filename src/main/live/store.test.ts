import { describe, expect, it, vi } from 'vitest'
import { LiveStore } from './store'

describe('LiveStore', () => {
  it('notifies listeners on every change', () => {
    const store = new LiveStore()
    const listener = vi.fn()
    store.onChange(listener)
    store.show({ id: 'a', text: 'Haleluya' })
    store.toggleOverlay('black')
    expect(listener).toHaveBeenCalledTimes(2)
    expect(store.get()).toMatchObject({ slide: { id: 'a' }, overlay: 'black' })
  })

  it('does not notify when the logo stays the same', () => {
    const store = new LiveStore()
    store.setLogo('egw://church/logo-1.png')
    const listener = vi.fn()
    store.onChange(listener)
    store.setLogo('egw://church/logo-1.png')
    expect(listener).not.toHaveBeenCalled()
  })

  it('stops notifying after unsubscribe', () => {
    const store = new LiveStore()
    const listener = vi.fn()
    store.onChange(listener)()
    store.clearOverlay()
    expect(listener).not.toHaveBeenCalled()
  })
})
