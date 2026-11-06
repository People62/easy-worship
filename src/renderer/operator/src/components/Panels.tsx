import { useState } from 'react'

interface PanelProps {
  title: string
  live?: boolean
  children: React.ReactNode
}

export function Panel({ title, live = false, children }: PanelProps): React.JSX.Element {
  return (
    <section className={live ? 'panel panel-live' : 'panel'} aria-label={title}>
      <h2 className="panel-title">
        {live && <span className="live-dot" aria-hidden />}
        {title}
      </h2>
      {children}
    </section>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p className="empty">{children}</p>
}

const LIBRARY_TABS = [
  { id: 'songs', label: 'Lagu', empty: '' },
  { id: 'bible', label: 'Alkitab', empty: 'Belum ada Alkitab. Tersedia di Tahap 4.' },
  { id: 'media', label: 'Media', empty: 'Belum ada media. Tersedia di Tahap 5.' },
  { id: 'themes', label: 'Tema', empty: 'Belum ada tema. Tersedia di Tahap 5.' }
] as const

type LibraryTabId = (typeof LIBRARY_TABS)[number]['id']

// The bottom panel. Each tab shows its own content; tabs that are not built
// yet show which phase brings them.
export function Library({ songs }: { songs: React.ReactNode }): React.JSX.Element {
  const [active, setActive] = useState<LibraryTabId>('songs')
  const tab = LIBRARY_TABS.find((t) => t.id === active) ?? LIBRARY_TABS[0]

  return (
    <section className="panel library" aria-label="Pustaka">
      <div className="tabs" role="tablist">
        {LIBRARY_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            className={t.id === active ? 'tab active' : 'tab'}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab.id === 'songs' ? songs : <EmptyState>{tab.empty}</EmptyState>}
    </section>
  )
}
