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
  { id: 'songs', label: 'Lagu' },
  { id: 'bible', label: 'Alkitab' },
  { id: 'media', label: 'Media' },
  { id: 'themes', label: 'Tema' }
] as const

export type LibraryTabId = (typeof LIBRARY_TABS)[number]['id']

// The bottom panel with one tab per kind of content.
export function Library({ tabs }: { tabs: Record<LibraryTabId, React.ReactNode> }): React.JSX.Element {
  const [active, setActive] = useState<LibraryTabId>('songs')

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
      {tabs[active]}
    </section>
  )
}
