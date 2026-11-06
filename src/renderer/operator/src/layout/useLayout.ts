import { useCallback, useEffect, useRef, useState } from 'react'
import { clampLayout, DEFAULT_SETTINGS, type AppSettings, type SettingsPatch } from '@shared/settings'

type Layout = AppSettings['layout']
type Key = keyof Layout

export interface LayoutSplitter {
  onStart: () => void
  onMove: (delta: number) => void
  onEnd: () => void
  onStep: (delta: number) => void
  onReset: () => void
}

// Panel sizes: follows the dividers while dragging and saves the result to
// the settings when the drag ends, so a restart opens with the same layout.
export function useLayout(
  saved: Layout,
  save: (patch: NonNullable<SettingsPatch['layout']>) => void,
  // Width of Preview + Live together, needed to turn pixels into a share.
  measureSplitWidth: () => number
): { layout: Layout; schedule: LayoutSplitter; preview: LayoutSplitter; library: LayoutSplitter } {
  const [draft, setDraft] = useState<Partial<Layout>>({})
  const base = useRef<{ value: number; width: number } | null>(null)
  const layout: Layout = { ...saved, ...draft }
  const layoutRef = useRef(layout)
  useEffect(() => {
    layoutRef.current = layout
  })

  const make = useCallback(
    (key: Key, toValue: (start: number, deltaPx: number, width: number) => number): LayoutSplitter => {
      const commit = (value: number): void => {
        setDraft({})
        save({ [key]: value })
      }
      return {
        onStart: () => {
          base.current = { value: layoutRef.current[key], width: measureSplitWidth() }
        },
        onMove: (delta) => {
          const start = base.current
          if (start) setDraft({ [key]: clampLayout(key, toValue(start.value, delta, start.width)) })
        },
        onEnd: () => {
          base.current = null
          commit(layoutRef.current[key])
        },
        onStep: (delta) => commit(clampLayout(key, toValue(layoutRef.current[key], delta, measureSplitWidth()))),
        onReset: () => commit(DEFAULT_SETTINGS.layout[key])
      }
    },
    [save, measureSplitWidth]
  )

  return {
    layout,
    schedule: make('scheduleWidth', (start, delta) => start + delta),
    preview: make('previewShare', (start, delta, width) => (width > 0 ? start + delta / width : start)),
    // The library is below its divider: dragging up makes it taller.
    library: make('libraryHeight', (start, delta) => start - delta)
  }
}
