import { useEffect, useState } from 'react'
import type { LiveState } from '@shared/live'

// Current Live state from the main process, kept up to date.
export function useLive(): LiveState | null {
  const [state, setState] = useState<LiveState | null>(null)
  useEffect(() => {
    let active = true
    void window.api.live.get().then((value) => {
      if (active) setState(value)
    })
    const unsubscribe = window.api.live.onChanged(setState)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
  return state
}
