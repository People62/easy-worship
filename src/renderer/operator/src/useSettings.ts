import { useCallback, useEffect, useState } from 'react'
import type { AppSettings, SettingsPatch } from '@shared/settings'

export interface SettingsState {
  settings: AppSettings | null
  update: (patch: SettingsPatch) => Promise<void>
  error: string | null
}

// Loads settings once, then follows every change made in any window.
export function useSettings(): SettingsState {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void window.api.settings.get().then((value) => {
      if (active) setSettings(value)
    })
    const unsubscribe = window.api.settings.onChanged(setSettings)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const update = useCallback(async (patch: SettingsPatch) => {
    try {
      setSettings(await window.api.settings.update(patch))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  return { settings, update, error }
}
