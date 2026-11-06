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

  it('moves through a deck and skips the broadcast at the last slide', () => {
    const store = new LiveStore()
    store.showDeck(
      {
        title: 'Lagu',
        slides: [
          { id: 'a', text: '1' },
          { id: 'b', text: '2' }
        ]
      },
      0
    )
    const listener = vi.fn()
    store.onChange(listener)
    store.step(5)
    expect(store.get().slide?.id).toBe('b')
    store.step(1)
    expect(listener).toHaveBeenCalledTimes(1)
    store.goTo(0)
    expect(store.get().index).toBe(0)
  })

  it('rejects a deck that is not a list of slides', () => {
    const store = new LiveStore()
    expect(() => store.showDeck({ title: 'x', slides: 'no' } as never, 0)).toThrow()
  })
})
