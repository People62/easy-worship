import { useEffect, useState } from 'react'
import type { AppSettings } from '@shared/settings'
import { resolveMode, themeVariables, type ResolvedMode } from './tokens'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function useSystemPrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia(DARK_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent): void => setPrefersDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return prefersDark
}

// Applies the chosen mode and primary color to the whole window and returns
// the mode actually in use ("system" resolved to dark or light).
export function useAppearance(appearance: AppSettings['appearance'] | undefined): ResolvedMode {
  const systemPrefersDark = useSystemPrefersDark()
  const resolved = resolveMode(appearance?.mode ?? 'dark', systemPrefersDark)
  const primary = appearance?.primary

  useEffect(() => {
    if (!primary) return
    const root = document.documentElement
    for (const [name, value] of Object.entries(themeVariables(resolved, primary))) {
      root.style.setProperty(name, value)
    }
    root.dataset.theme = resolved
    root.style.colorScheme = resolved
  }, [resolved, primary])

  return resolved
}
