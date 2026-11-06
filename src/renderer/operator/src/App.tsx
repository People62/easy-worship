import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildSongSlides } from '@shared/slides'
import type { Song, SongSummary } from '@shared/songs'
import { SlideRenderer } from '../../shared/SlideRenderer'
import { useLive } from '../../shared/useLive'
import { EmptyState, Library, Panel } from './components/Panels'
import { SettingsDialog } from './components/SettingsDialog'
import { TopBar } from './components/TopBar'
import { errorMessage } from './errors'
import { PreviewPanel } from './preview/PreviewPanel'
import { SongEditorDialog } from './songs/SongEditorDialog'
import { SongLibrary } from './songs/SongLibrary'
import { useAppearance } from './theme/useAppearance'
import { useLiveShortcuts } from './useLiveShortcuts'
import { useOutputStatus } from './useOutputStatus'
import { useSettings } from './useSettings'

// The song editor is either closed, open for a new song, or open for one song.
type EditorState = { open: false } | { open: true; song: Song | null }

export function App(): React.JSX.Element {
  const { settings, update, error } = useSettings()
  const mode = useAppearance(settings?.appearance)
  const live = useLive()
  const outputStatus = useOutputStatus()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editor, setEditor] = useState<EditorState>({ open: false })
  const [actionError, setActionError] = useState<string | null>(null)

  const [previewSong, setPreviewSong] = useState<Song | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const linesPerSlide = settings?.songs.linesPerSlide ?? 4
  const slides = useMemo(
    () => (previewSong ? buildSongSlides(previewSong, linesPerSlide) : []),
    [previewSong, linesPerSlide]
  )
  const safeIndex = Math.min(selectedIndex, Math.max(0, slides.length - 1))

  const run = useCallback(async (action: () => Promise<unknown>): Promise<void> => {
    try {
      await action()
      setActionError(null)
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }, [])

  const openSong = useCallback(
    (id: number, keepIndex = false) =>
      run(async () => {
        const song = await window.api.songs.get(id)
        setPreviewSong(song)
        if (!keepIndex) setSelectedIndex(0)
      }),
    [run]
  )

  // Keep the preview in sync when its song is edited or deleted elsewhere.
  const previewIdRef = useRef<number | null>(null)
  useEffect(() => {
    previewIdRef.current = previewSong?.id ?? null
  }, [previewSong])
  useEffect(
    () =>
      window.api.songs.onChanged((id) => {
        if (previewIdRef.current === id) void openSong(id, true)
      }),
    [openSong]
  )

  const sendSlide = useCallback(
    (index: number) => {
      const slide = slides[index]
      if (!slide) return
      setSelectedIndex(index)
      void run(() => window.api.live.show(slide))
    },
    [slides, run]
  )

  const deleteSong = (song: SongSummary): void => {
    if (!window.confirm(`Hapus lagu "${song.title}"? Ini tidak bisa dibatalkan.`)) return
    void run(async () => {
      await window.api.songs.delete(song.id)
      if (previewSong?.id === song.id) setPreviewSong(null)
    })
  }

  const shortcuts = useMemo(
    () => ({
      onToggleOverlay: (overlay: 'black' | 'clear' | 'logo') => void window.api.live.toggleOverlay(overlay),
      onClearOverlay: () => void window.api.live.clearOverlay(),
      onSendPreview: () => sendSlide(safeIndex),
      onMovePreview: (delta: number) =>
        setSelectedIndex((index) => Math.min(Math.max(0, index + delta), Math.max(0, slides.length - 1))),
      onOpenSettings: () => setSettingsOpen(true)
    }),
    [sendSlide, safeIndex, slides.length]
  )
  useLiveShortcuts(shortcuts, !settingsOpen && !editor.open)

  if (!settings || !live) return <div className="loading">Memuat…</div>

  return (
    <div className="app">
      <TopBar
        mode={mode}
        overlay={live.overlay}
        outputStatus={outputStatus}
        onToggleOverlay={shortcuts.onToggleOverlay}
        onToggleMode={() => void update({ appearance: { mode: mode === 'dark' ? 'light' : 'dark' } })}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="workspace">
        <Panel title="Schedule">
          <EmptyState>Belum ada item. Schedule tersedia di Tahap 6.</EmptyState>
        </Panel>

        <Panel title="Preview">
          <PreviewPanel
            song={previewSong}
            slides={slides}
            selectedIndex={safeIndex}
            liveSlideId={live.slide?.id ?? null}
            live={live}
            onSelect={setSelectedIndex}
            onSend={sendSlide}
          />
        </Panel>

        <Panel title="Live" live>
          <div className="slide-frame">
            <SlideRenderer slide={live.slide} style={live.style} overlay={live.overlay} logoUrl={live.logoUrl} />
          </div>
          <div className="row">
            <button
              type="button"
              className="btn"
              disabled={!live.slide}
              onClick={() => void window.api.live.show(null)}
            >
              Kosongkan Live
            </button>
          </div>
          <EmptyState>
            {live.overlay === 'black' && 'Layar hitam aktif. Tekan F5 atau Esc untuk kembali.'}
            {live.overlay === 'clear' && 'Teks disembunyikan. Tekan F6 atau Esc untuk kembali.'}
            {live.overlay === 'logo' && 'Logo tampil. Tekan F7 atau Esc untuk kembali.'}
            {live.overlay === 'none' &&
              (live.slide ? `${live.slide.label ?? 'Slide'} · sama dengan di TV jemaat.` : 'Live kosong.')}
          </EmptyState>
        </Panel>

        <Library
          songs={
            <SongLibrary
              selectedId={previewSong?.id ?? null}
              onSelect={(song) => void openSong(song.id)}
              onCreate={() => setEditor({ open: true, song: null })}
              onEdit={(id) =>
                void run(async () => {
                  const song = await window.api.songs.get(id)
                  if (song) setEditor({ open: true, song })
                })
              }
              onDelete={deleteSong}
            />
          }
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
            setPreviewSong(song)
            setSelectedIndex(0)
          }}
          onClose={() => setEditor({ open: false })}
        />
      )}

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
