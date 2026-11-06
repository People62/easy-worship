import { useEffect, useState } from 'react'
import type { MediaItem } from '@shared/ipc'
import type { Theme } from '@shared/theme'
import { makeThumbnail } from './thumbnail'

export function useMedia(): MediaItem[] | null {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  useEffect(() => {
    void window.api.media.list().then(setItems)
    return window.api.media.onChanged(setItems)
  }, [])

  // Media imported without a thumbnail gets one, one file at a time so a big
  // import does not load many videos at once.
  useEffect(() => {
    const next = items?.find((item) => !item.thumbnailUrl && !failedThumbnails.has(item.id))
    if (!next) return
    let active = true
    makeThumbnail(next)
      .then((info) => (active ? window.api.media.setInfo(next.id, info) : undefined))
      .catch(() => {
        failedThumbnails.add(next.id)
        if (active) setItems((list) => (list ? [...list] : list))
      })
    return () => {
      active = false
    }
  }, [items])

  return items
}

// Files the browser could not decode (for example an unsupported codec).
export const failedThumbnails = new Set<number>()

export function useThemes(): Theme[] | null {
  const [themes, setThemes] = useState<Theme[] | null>(null)
  useEffect(() => {
    void window.api.themes.list().then(setThemes)
    return window.api.themes.onChanged(setThemes)
  }, [])
  return themes
}
