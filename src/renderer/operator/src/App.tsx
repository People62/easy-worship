import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildBibleSlides } from '@shared/bible/slides'
import type { BiblePassage, MediaItem } from '@shared/ipc'
import { DEFAULT_SLIDE_STYLE, findJump, type Slide, type SlideStyle } from '@shared/live'
import { textSlides, type NewScheduleItem, type ScheduleItem } from '@shared/schedule'
import type { ThemeKind } from '@shared/theme'
import { buildSongSlides } from '@shared/slides'
import type { Song, SongSummary } from '@shared/songs'
import { useLive } from '../../shared/useLive'
import { EmptyState, Library, Panel, type LibraryTabId } from './components/Panels'
import { SettingsDialog } from './components/SettingsDialog'
import { ShortcutsDialog } from './components/ShortcutsDialog'
import { TopBar } from './components/TopBar'
import { BibleLibrary } from './bible/BibleLibrary'
import { errorMessage } from './errors'
import { Splitter } from './layout/Splitter'
import { toRem, useLayout } from './layout/useLayout'
import { LivePanel } from './live/LivePanel'
import { MediaLibrary } from './media/MediaLibrary'
import { useMedia, useThemes } from './media/useMedia'
import { ThemeLibrary } from './themes/ThemeLibrary'
import { PreviewPanel } from './preview/PreviewPanel'
import { SchedulePanel } from './schedule/SchedulePanel'
import { TextItemDialog } from './schedule/TextItemDialog'
import { selectedIndex, useRecentSchedules, useSchedule } from './schedule/useSchedule'
import { SongEditorDialog } from './songs/SongEditorDialog'
import { SongLibrary } from './songs/SongLibrary'
import { useAppearance } from './theme/useAppearance'
import { useLiveShortcuts, type Shortcuts } from './useLiveShortcuts'
import { useOutputStatus } from './useOutputStatus'
import { useSettings } from './useSettings'

// The song editor is either closed, open for a new song, or open for one song.
type EditorState = { open: false } | { open: true; song: Song | null }

// What Preview shows. `scheduleUid` is set when it was opened from the
// Schedule, so Live can mark that row.
type PreviewItem = (
  | { kind: 'song'; song: Song }
  | { kind: 'bible'; passage: BiblePassage }
  | { kind: 'media'; item: MediaItem }
  | { kind: 'text'; item: ScheduleItem & { kind: 'text' } }
) & { scheduleUid?: string }

// The text editor is closed, open for a new announcement, or open for the
// schedule item at an index.
type TextEditorState = { open: false } | { open: true; index: number | null }

const OVERLAY_BADGES = { black: 'Black', clear: 'Clear', logo: 'Logo' } as const

// A picture or video shown on its own: no text, the full image, not dimmed.
function mediaSlide(item: MediaItem, base: SlideStyle): Slide {
  return {
    id: `media:${item.id}`,
    text: '',
    label: item.name,
    style: {
      ...base,
      backgroundDim: 0,
      background:
        item.kind === 'image'
          ? { kind: 'image', mediaId: item.id, url: item.url }
          : { kind: 'video', mediaId: item.id, url: item.url, posterUrl: item.thumbnailUrl }
    }
  }
}

function previewTitle(preview: PreviewItem | null): string | null {
  switch (preview?.kind) {
    case 'song':
      return preview.song.title
    case 'bible':
      return preview.passage.title
    case 'media':
      return preview.item.name
    case 'text':
      return preview.item.title
    default:
      return null
  }
}

// What adding the preview to the schedule would add.
function toScheduleItem(preview: PreviewItem | null): NewScheduleItem | null {
  switch (preview?.kind) {
    case 'song':
      return { kind: 'song', songId: preview.song.id, title: preview.song.title }
    case 'bible':
      return {
        kind: 'bible',
        versionId: preview.passage.versionId,
        abbreviation: preview.passage.abbreviation,
        reference: preview.passage.reference,
        title: preview.passage.title
      }
    case 'media':
      return { kind: 'media', mediaId: preview.item.id, title: preview.item.name }
    case 'text':
      return { kind: 'text', title: preview.item.title, body: preview.item.body }
    default:
      return null
  }
}

export function App(): React.JSX.Element {
  const { settings, update, error } = useSettings()
  const mode = useAppearance(settings?.appearance)
  const live = useLive()
  const outputStatus = useOutputStatus()
  const media = useMedia()
  const themes = useThemes()
  const [schedule, scheduleActions] = useSchedule()
  const recentSchedules = useRecentSchedules()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [editor, setEditor] = useState<EditorState>({ open: false })
  const [textEditor, setTextEditor] = useState<TextEditorState>({ open: false })
  const [libraryTab, setLibraryTab] = useState<LibraryTabId>('songs')
  const [actionError, setActionError] = useState<string | null>(null)

  const [preview, setPreview] = useState<PreviewItem | null>(null)
  const [selectedSlide, setSelectedSlide] = useState(0)
  const previewSong = preview?.kind === 'song' ? preview.song : null
  const linesPerSlide = settings?.songs.linesPerSlide ?? 4

  const showPreview = useCallback((item: PreviewItem | null) => {
    setPreview(item)
    setSelectedSlide(0)
  }, [])

  // The style of each kind of slide comes from its default theme.
  const themeDefaults = settings?.themes
  const styleFor = useCallback(
    (kind: ThemeKind): SlideStyle | undefined =>
      (themes?.find((t) => t.id === themeDefaults?.[kind]) ?? themes?.find((t) => t.kind === kind))?.style,
    [themes, themeDefaults]
  )

  const slides = useMemo(() => {
    switch (preview?.kind) {
      case 'song':
        return buildSongSlides(preview.song, linesPerSlide, styleFor('song'))
      case 'bible':
        return buildBibleSlides(preview.passage.verses, preview.passage.abbreviation, styleFor('bible'))
      case 'media':
        return [mediaSlide(preview.item, styleFor('text') ?? DEFAULT_SLIDE_STYLE)]
      case 'text':
        return textSlides(preview.item, styleFor('text'))
      default:
        return []
    }
  }, [preview, linesPerSlide, styleFor])
  const safeIndex = Math.min(selectedSlide, Math.max(0, slides.length - 1))

  const report = useCallback((err: unknown) => setActionError(errorMessage(err)), [])
  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<void> => {
      try {
        await action()
        setActionError(null)
      } catch (err) {
        report(err)
      }
    },
    [report]
  )

  // Opening schedule items is async; only the last request may win, so
  // pressing Down quickly never ends on an older item.
  const openRequest = useRef(0)
  const openScheduleItem = useCallback(
    (item: ScheduleItem) => {
      const request = ++openRequest.current
      const done = (next: PreviewItem): void => {
        if (request === openRequest.current) showPreview({ ...next, scheduleUid: item.uid })
      }
      void run(async () => {
        switch (item.kind) {
          case 'song': {
            const song = await window.api.songs.get(item.songId)
            if (!song) throw new Error(`Lagu "${item.title}" tidak ada di pustaka. Mungkin sudah dihapus.`)
            return done({ kind: 'song', song })
          }
          case 'bible': {
            // On another computer the same translation may have another id.
            const versions = await window.api.bible.listVersions()
            const version =
              versions.find((v) => v.id === item.versionId) ??
              versions.find((v) => v.abbreviation === item.abbreviation)
            if (!version) throw new Error(`Terjemahan ${item.abbreviation || ''} belum diimpor di komputer ini.`)
            return done({ kind: 'bible', passage: await window.api.bible.getPassage(version.id, item.reference) })
          }
          case 'media': {
            const found = media?.find((m) => m.id === item.mediaId)
            if (!found) throw new Error(`Media "${item.title}" tidak ada di pustaka. Mungkin sudah dihapus.`)
            return done({ kind: 'media', item: found })
          }
          case 'text':
            return done({ kind: 'text', item })
        }
      })
    },
    [run, showPreview, media]
  )

  // Keep the preview in sync when its song is edited or deleted elsewhere.
  const previewSongId = previewSong?.id ?? null
  useEffect(
    () =>
      window.api.songs.onChanged((id) => {
        if (previewSongId !== id) return
        void window.api.songs.get(id).then((song) =>
          setPreview((p) => {
            if (p?.kind !== 'song' || p.song.id !== id) return p
            return song ? { ...p, song } : null
          })
        )
      }),
    [previewSongId]
  )

  const sendPreview = useCallback(
    (index: number) => {
      if (!slides[index]) return
      setSelectedSlide(index)
      const deck = {
        title: previewTitle(preview) ?? '',
        slides,
        ...(preview?.scheduleUid ? { source: preview.scheduleUid } : {})
      }
      void run(() => window.api.live.showDeck(deck, index))
    },
    [slides, preview, run]
  )

  const addPreviewToSchedule = useCallback(() => {
    const item = toScheduleItem(preview)
    if (!item) return
    // After the selected item, so building a service in order is quick.
    const at = selectedIndex(schedule)
    scheduleActions.add(item, at === null ? undefined : at + 1)
  }, [preview, schedule, scheduleActions])

  const moveSchedule = useCallback(
    (delta: number) => {
      if (schedule.items.length === 0) return
      const current = selectedIndex(schedule)
      const next =
        current === null
          ? delta > 0
            ? 0
            : schedule.items.length - 1
          : Math.min(Math.max(0, current + delta), schedule.items.length - 1)
      if (next === current) return
      scheduleActions.select(next)
      openScheduleItem(schedule.items[next]!)
      // Keep keyboard focus on the selected row when it is in the list.
      const focused = document.activeElement as HTMLElement | null
      if (focused?.dataset.scheduleRow !== undefined) {
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-schedule-row="${next}"]`)?.focus())
      }
    },
    [schedule, scheduleActions, openScheduleItem]
  )

  const focusSearch = useCallback(() => {
    const tab = libraryTab === 'bible' ? 'bible' : 'songs'
    setLibraryTab(tab)
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>('.library input.search')
      input?.focus()
      input?.select()
    })
  }, [libraryTab])

  const deleteSong = (song: SongSummary): void => {
    if (!window.confirm(`Hapus lagu "${song.title}"? Ini tidak bisa dibatalkan.`)) return
    void run(async () => {
      await window.api.songs.delete(song.id)
      if (previewSong?.id === song.id) showPreview(null)
    })
  }

  const shortcuts = useMemo<Shortcuts>(
    () => ({
      onToggleOverlay: (overlay) => void window.api.live.toggleOverlay(overlay),
      onClearOverlay: () => void window.api.live.clearOverlay(),
      onOpenSettings: () => setSettingsOpen(true),
      onShowHelp: () => setHelpOpen(true),
      onSendPreview: () => sendPreview(safeIndex),
      onStepLive: (delta) => void window.api.live.step(delta),
      onJumpLive: (key) => {
        if (!live?.deck) return
        const index = findJump(live.deck.slides, key, live.index)
        if (index !== -1) void window.api.live.goTo(index)
      },
      onMovePreview: (delta) =>
        setSelectedSlide((index) => Math.min(Math.max(0, index + delta), Math.max(0, slides.length - 1))),
      onMoveSchedule: moveSchedule,
      onAddToSchedule: addPreviewToSchedule,
      onFocusSearch: focusSearch,
      onNewSchedule: () => scheduleActions.reset(),
      onOpenSchedule: () => void scheduleActions.open().catch(report),
      onSaveSchedule: (saveAs) => void scheduleActions.save(saveAs).catch(report)
    }),
    [
      sendPreview,
      safeIndex,
      live,
      slides.length,
      moveSchedule,
      addPreviewToSchedule,
      focusSearch,
      scheduleActions,
      report
    ]
  )
  const dialogOpen = settingsOpen || helpOpen || editor.open || textEditor.open
  useLiveShortcuts(shortcuts, !dialogOpen)

  const workspaceRef = useRef<HTMLElement>(null)
  const measureSplitWidth = useCallback(() => {
    const panels = workspaceRef.current?.querySelectorAll<HTMLElement>('.area-preview, .area-live')
    return [...(panels ?? [])].reduce((sum, panel) => sum + panel.getBoundingClientRect().width, 0)
  }, [])
  const saveLayout = useCallback(
    (patch: Parameters<typeof update>[0]['layout']) => void update({ layout: patch }),
    [update]
  )
  const { layout, ...splitters } = useLayout(
    settings?.layout ?? { scheduleWidth: 260, previewShare: 0.5, libraryHeight: 280 },
    saveLayout,
    measureSplitWidth
  )

  if (!settings || !live) return <div className="loading">Memuat…</div>

  const inSchedule = !!preview?.scheduleUid && schedule.items.some((item) => item.uid === preview.scheduleUid)
  const editingText = textEditor.open && textEditor.index !== null ? schedule.items[textEditor.index] : undefined

  return (
    <div className="app">
      <TopBar
        mode={mode}
        overlay={live.overlay}
        outputStatus={outputStatus}
        onToggleOverlay={shortcuts.onToggleOverlay}
        onToggleMode={() => void update({ appearance: { mode: mode === 'dark' ? 'light' : 'dark' } })}
        onOpenSettings={() => setSettingsOpen(true)}
        onShowHelp={() => setHelpOpen(true)}
      />

      <main
        ref={workspaceRef}
        className="workspace"
        style={{
          gridTemplateColumns: `min(${toRem(layout.scheduleWidth)}, 35%) 8px minmax(0, ${layout.previewShare}fr) 8px minmax(0, ${1 - layout.previewShare}fr)`,
          gridTemplateRows: `minmax(0, 1fr) 8px min(${toRem(layout.libraryHeight)}, 60%)`
        }}
      >
        <Panel title="Schedule" className="area-schedule">
          <SchedulePanel
            schedule={schedule}
            actions={scheduleActions}
            recent={recentSchedules}
            liveUid={live.deck?.source ?? null}
            onOpenItem={openScheduleItem}
            onNewText={() => setTextEditor({ open: true, index: null })}
            onEditText={(index) => setTextEditor({ open: true, index })}
            onError={report}
          />
        </Panel>
        <Splitter direction="columns" label="Lebar Schedule" className="area-split-1" {...splitters.schedule} />

        <Panel title="Preview" className="area-preview">
          <PreviewPanel
            title={previewTitle(preview)}
            slides={slides}
            selectedIndex={safeIndex}
            liveSlideId={live.slide?.id ?? null}
            live={live}
            scheduleItem={inSchedule ? null : toScheduleItem(preview)}
            onSelect={setSelectedSlide}
            onSend={sendPreview}
            onAddToSchedule={addPreviewToSchedule}
          />
        </Panel>
        <Splitter direction="columns" label="Lebar Preview dan Live" className="area-split-2" {...splitters.preview} />

        <Panel
          title="Live"
          live
          badge={live.overlay === 'none' ? null : OVERLAY_BADGES[live.overlay]}
          className="area-live"
        >
          <LivePanel live={live} />
        </Panel>

        <Splitter direction="rows" label="Tinggi Pustaka" className="area-split-3" {...splitters.library} />

        <Library
          active={libraryTab}
          onChange={setLibraryTab}
          tabs={{
            media: (
              <MediaLibrary
                items={media}
                selectedId={preview?.kind === 'media' ? preview.item.id : null}
                onSelect={(item) => showPreview({ kind: 'media', item })}
              />
            ),
            themes:
              themes && media ? (
                <ThemeLibrary
                  themes={themes}
                  media={media}
                  defaults={settings.themes}
                  onSetDefault={(patch) => void update({ themes: patch })}
                />
              ) : (
                <EmptyState>Memuat…</EmptyState>
              ),
            bible: (
              <BibleLibrary
                versionId={settings.bible.versionId}
                onVersionChange={(versionId) => void update({ bible: { versionId } })}
                onOpenPassage={(passage) => showPreview({ kind: 'bible', passage })}
              />
            ),
            songs: (
              <SongLibrary
                selectedId={inSchedule ? null : (previewSong?.id ?? null)}
                onSelect={(song) =>
                  void run(async () => {
                    const full = await window.api.songs.get(song.id)
                    showPreview(full ? { kind: 'song', song: full } : null)
                  })
                }
                onCreate={() => setEditor({ open: true, song: null })}
                onEdit={(id) =>
                  void run(async () => {
                    const song = await window.api.songs.get(id)
                    if (song) setEditor({ open: true, song })
                  })
                }
                onDelete={deleteSong}
              />
            )
          }}
        />
      </main>

      {actionError && (
        <div className="toast" role="alert">
          {actionError}
          <button type="button" className="btn" onClick={() => setActionError(null)}>
            Tutup
          </button>
        </div>
      )}

      {editor.open && (
        <SongEditorDialog
          song={editor.song}
          linesPerSlide={linesPerSlide}
          onSaved={(song) => {
            setEditor({ open: false })
            showPreview({ kind: 'song', song })
          }}
          onClose={() => setEditor({ open: false })}
        />
      )}

      {textEditor.open && (
        <TextItemDialog
          initial={editingText?.kind === 'text' ? editingText : null}
          style={styleFor('text')}
          onSave={({ title, body }) => {
            setTextEditor({ open: false })
            if (editingText?.kind === 'text' && textEditor.index !== null) {
              const item = { ...editingText, title, body }
              scheduleActions.replace(textEditor.index, item)
              if (preview?.scheduleUid === item.uid) setPreview({ kind: 'text', item, scheduleUid: item.uid })
            } else {
              const at = selectedIndex(schedule)
              openScheduleItem(scheduleActions.add({ kind: 'text', title, body }, at === null ? undefined : at + 1))
            }
          }}
          onClose={() => setTextEditor({ open: false })}
        />
      )}

      {helpOpen && <ShortcutsDialog onClose={() => setHelpOpen(false)} />}

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        logoUrl={live.logoUrl}
        error={error ?? actionError}
        onUpdate={(patch) => void update(patch)}
        onChooseLogo={() => void run(() => window.api.church.chooseLogo())}
        onRemoveLogo={() => void run(() => window.api.church.removeLogo())}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
