import { useCallback, useEffect, useMemo, useState } from 'react'
import type { OpenedSchedule, RecentSchedule } from '@shared/ipc'
import {
  insertItem,
  moveItem,
  newUid,
  removeItem,
  withUid,
  type NewScheduleItem,
  type ScheduleItem
} from '@shared/schedule'

export interface ScheduleState {
  items: ScheduleItem[]
  // The file it was opened from or saved to, or null for a new schedule.
  path: string | null
  name: string | null
  dirty: boolean
  // Tracked by uid so it stays on the same item when rows move.
  selectedUid: string | null
}

// name is null for a new schedule; the panel shows "Schedule baru" in the current language.
const EMPTY: ScheduleState = { items: [], path: null, name: null, dirty: false, selectedUid: null }

export function selectedIndex(state: ScheduleState): number | null {
  const index = state.items.findIndex((item) => item.uid === state.selectedUid)
  return index === -1 ? null : index
}

export interface ScheduleActions {
  add: (item: NewScheduleItem, at?: number) => ScheduleItem
  move: (from: number, to: number) => void
  remove: (index: number) => void
  duplicate: (index: number) => void
  replace: (index: number, item: ScheduleItem) => void
  select: (index: number | null) => void
  // These ask before throwing away unsaved changes. They resolve to false
  // when the operator cancels.
  reset: () => boolean
  open: () => Promise<OpenedSchedule | null>
  openRecent: (path: string) => Promise<OpenedSchedule | null>
  save: (saveAs?: boolean) => Promise<boolean>
}

const DISCARD = 'Schedule belum disimpan. Buang perubahan?'

export function useSchedule(): [ScheduleState, ScheduleActions] {
  const [state, setState] = useState<ScheduleState>(EMPTY)

  // Ask the main process to confirm before the window closes with unsaved
  // changes (see will-prevent-unload in main).
  useEffect(() => {
    if (!state.dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent): void => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [state.dirty])

  const edit = useCallback((change: (items: ScheduleItem[]) => ScheduleItem[], select?: string) => {
    setState((s) => {
      const items = change(s.items)
      if (items === s.items) return s
      const selectedUid = select ?? (items.some((i) => i.uid === s.selectedUid) ? s.selectedUid : null)
      return { ...s, items, dirty: true, selectedUid }
    })
  }, [])

  const load = useCallback((opened: OpenedSchedule) => {
    setState({ items: opened.items, path: opened.path, name: opened.name, dirty: false, selectedUid: null })
    return opened
  }, [])

  const confirmDiscard = useCallback((): boolean => !state.dirty || window.confirm(DISCARD), [state.dirty])

  const actions = useMemo<ScheduleActions>(
    () => ({
      add: (item, at) => {
        const added = withUid(item)
        edit((items) => insertItem(items, added, at ?? items.length), added.uid)
        return added
      },
      move: (from, to) => edit((items) => moveItem(items, from, to)),
      remove: (index) => edit((items) => removeItem(items, index)),
      duplicate: (index) => {
        const item = state.items[index]
        if (!item) return
        const copy = { ...item, uid: newUid() }
        edit((items) => insertItem(items, copy, index + 1), copy.uid)
      },
      replace: (index, item) => edit((items) => items.map((old, i) => (i === index ? item : old))),
      select: (index) =>
        setState((s) => ({ ...s, selectedUid: index === null ? null : (s.items[index]?.uid ?? null) })),
      reset: () => {
        if (!confirmDiscard()) return false
        setState(EMPTY)
        return true
      },
      open: async () => {
        if (!confirmDiscard()) return null
        const opened = await window.api.schedule.open()
        return opened ? load(opened) : null
      },
      openRecent: async (path) => {
        if (!confirmDiscard()) return null
        return load(await window.api.schedule.openRecent(path))
      },
      save: async (saveAs = false) => {
        const items = state.items
        const saved = await window.api.schedule.save(items, saveAs ? null : state.path)
        if (!saved) return false
        // Still dirty if the schedule was changed while the dialog was open.
        setState((s) => ({ ...s, path: saved.path, name: saved.name, dirty: s.items !== items }))
        return true
      }
    }),
    [edit, load, confirmDiscard, state.items, state.path]
  )

  return [state, actions]
}

export function useRecentSchedules(): RecentSchedule[] {
  const [recent, setRecent] = useState<RecentSchedule[]>([])
  useEffect(() => {
    let alive = true
    void window.api.schedule.listRecent().then((list) => alive && setRecent(list))
    const off = window.api.schedule.onRecentChanged(setRecent)
    return () => {
      alive = false
      off()
    }
  }, [])
  return recent
}
