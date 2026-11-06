import { useMemo, useState } from 'react'
import type { Slide } from '@shared/live'
import { SlideRenderer } from '../../shared/SlideRenderer'
import { useLive } from '../../shared/useLive'
import { EmptyState, Library, Panel } from './components/Panels'
import { SettingsDialog } from './components/SettingsDialog'
import { TopBar } from './components/TopBar'
import { useAppearance } from './theme/useAppearance'
import { useLiveShortcuts } from './useLiveShortcuts'
import { useOutputStatus } from './useOutputStatus'
import { useSettings } from './useSettings'

const SAMPLE_TEXT = 'Bapa Engkau sungguh baik\nKasih-Mu melimpah di hidupku'

export function App(): React.JSX.Element {
  const { settings, update, error } = useSettings()
  const mode = useAppearance(settings?.appearance)
  const live = useLive()
  const outputStatus = useOutputStatus()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const runLogo = async (action: () => Promise<unknown>): Promise<void> => {
    try {
      await action()
      setLogoError(null)
    } catch (err) {
      setLogoError(
        err instanceof Error
          ? err.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
          : String(err)
      )
    }
  }

  // Temporary test slide (phase 2), until songs and Bible verses exist.
  const [testText, setTestText] = useState(SAMPLE_TEXT)
  const previewSlide: Slide | null = useMemo(
    () => (testText.trim() ? { id: 'test', text: testText, label: 'Slide uji' } : null),
    [testText]
  )

  const shortcuts = useMemo(
    () => ({
      onToggleOverlay: (overlay: 'black' | 'clear' | 'logo') => void window.api.live.toggleOverlay(overlay),
      onClearOverlay: () => void window.api.live.clearOverlay(),
      onSendPreview: () => {
        if (previewSlide) void window.api.live.show({ ...previewSlide, id: `test-${Date.now()}` })
      },
      onOpenSettings: () => setSettingsOpen(true)
    }),
    [previewSlide]
  )
  useLiveShortcuts(shortcuts, !settingsOpen)

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
          <EmptyState>Belum ada item. Nanti lagu, ayat, dan media diseret dari Pustaka ke sini.</EmptyState>
        </Panel>

        <Panel title="Preview">
          <div className="slide-frame">
            <SlideRenderer slide={previewSlide} style={live.style} overlay="none" logoUrl={live.logoUrl} />
          </div>
          <label className="test-slide">
            <span>Slide uji (sementara, sampai fitur Lagu dan Alkitab ada)</span>
            <textarea value={testText} rows={3} onChange={(event) => setTestText(event.target.value)} />
          </label>
          <div className="row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!previewSlide}
              onClick={shortcuts.onSendPreview}
            >
              Kirim ke Live <kbd>Enter</kbd>
            </button>
            <button type="button" className="btn" onClick={() => void window.api.live.show(null)}>
              Kosongkan Live
            </button>
          </div>
        </Panel>

        <Panel title="Live" live>
          <div className="slide-frame">
            <SlideRenderer slide={live.slide} style={live.style} overlay={live.overlay} logoUrl={live.logoUrl} />
          </div>
          <EmptyState>
            {live.overlay === 'black' && 'Layar hitam aktif. Tekan F5 atau Esc untuk kembali.'}
            {live.overlay === 'clear' && 'Teks disembunyikan. Tekan F6 atau Esc untuk kembali.'}
            {live.overlay === 'logo' && 'Logo tampil. Tekan F7 atau Esc untuk kembali.'}
            {live.overlay === 'none' && (live.slide ? 'Yang tampil di sini sama dengan di TV jemaat.' : 'Live kosong.')}
          </EmptyState>
        </Panel>

        <Library />
      </main>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        logoUrl={live.logoUrl}
        error={error ?? logoError}
        onUpdate={(patch) => void update(patch)}
        onChooseLogo={() => void runLogo(() => window.api.church.chooseLogo())}
        onRemoveLogo={() => void runLogo(() => window.api.church.removeLogo())}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
