import { useEffect, useState } from 'react'
import { EmptyState, Library, Panel, SlideFrame } from './components/Panels'
import { SettingsDialog } from './components/SettingsDialog'
import { TopBar } from './components/TopBar'
import { useAppearance } from './theme/useAppearance'
import { useSettings } from './useSettings'

export function App(): React.JSX.Element {
  const { settings, update, error } = useSettings()
  const mode = useAppearance(settings?.appearance)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Ctrl+, opens settings, as in most desktop apps.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.key === ',') {
        event.preventDefault()
        setSettingsOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!settings) return <div className="loading">Memuat…</div>

  return (
    <div className="app">
      <TopBar
        mode={mode}
        onToggleMode={() => void update({ appearance: { mode: mode === 'dark' ? 'light' : 'dark' } })}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="workspace">
        <Panel title="Schedule">
          <EmptyState>Belum ada item. Nanti lagu, ayat, dan media diseret dari Pustaka ke sini.</EmptyState>
        </Panel>
        <Panel title="Preview">
          <SlideFrame />
          <EmptyState>Pilih item di Schedule untuk melihat slidenya.</EmptyState>
        </Panel>
        <Panel title="Live" live>
          <SlideFrame />
          <EmptyState>Yang tampil di sini sama dengan di TV jemaat.</EmptyState>
        </Panel>
        <Library />
      </main>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        error={error}
        onUpdate={(patch) => void update(patch)}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
