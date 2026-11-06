import { useEffect, useState } from 'react'
import type { OutputStatus } from '@shared/output'

export function useOutputStatus(): OutputStatus | null {
  const [status, setStatus] = useState<OutputStatus | null>(null)
  useEffect(() => {
    let active = true
    void window.api.output.getStatus().then((value) => {
      if (active) setStatus(value)
    })
    const unsubscribe = window.api.output.onStatusChanged(setStatus)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
  return status
}
