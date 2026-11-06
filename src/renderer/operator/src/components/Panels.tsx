interface PanelProps {
  title: string
  live?: boolean
  className?: string
  children: React.ReactNode
}

export function Panel({ title, live = false, className, children }: PanelProps): React.JSX.Element {
  return (
    <section className={['panel', live ? 'panel-live' : '', className ?? ''].join(' ')} aria-label={title}>
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
export function Library(props: {
  tabs: Record<LibraryTabId, React.ReactNode>
  active: LibraryTabId
  onChange: (tab: LibraryTabId) => void
}): React.JSX.Element {
  const { tabs, active, onChange: setActive } = props

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
