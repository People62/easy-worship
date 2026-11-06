import { useEffect, useState } from 'react'
import type { SongSummary } from '@shared/songs'

const DEBOUNCE_MS = 120

// Searches as the operator types, and refreshes when any song changes.
export function useSongSearch(query: string): { results: SongSummary[]; error: string | null } {
  const [results, setResults] = useState<SongSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => window.api.songs.onChanged(() => setVersion((v) => v + 1)), [])

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      window.api.songs
        .search(query)
        .then((found) => {
          if (!active) return
          setResults(found)
          setError(null)
        })
        .catch((err: unknown) => {
          if (active) setError(err instanceof Error ? err.message : String(err))
        })
    }, DEBOUNCE_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, version])

  return { results, error }
}
