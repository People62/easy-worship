import { BookIcon, ImageIcon, MusicIcon, PaletteIcon } from './Icons'

interface PanelProps {
  title: string
  live?: boolean
  // A short status next to the title, e.g. "Black" on the Live panel.
  badge?: string | null
  className?: string
  children: React.ReactNode
}

export function Panel({ title, live = false, badge, className, children }: PanelProps): React.JSX.Element {
  return (
    <section className={['panel', live ? 'panel-live' : '', className ?? ''].join(' ')} aria-label={title}>
      <h2 className="panel-title">
        {live && <span className="live-dot" aria-hidden />}
        {title}
        {badge && <span className="panel-badge">{badge}</span>}
      </h2>
      {children}
    </section>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p className="empty">{children}</p>
}

const LIBRARY_TABS = [
  { id: 'songs', label: 'Lagu', Icon: MusicIcon },
  { id: 'bible', label: 'Alkitab', Icon: BookIcon },
  { id: 'media', label: 'Media', Icon: ImageIcon },
  { id: 'themes', label: 'Tema', Icon: PaletteIcon }
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
        {LIBRARY_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === active}
            className={id === active ? 'tab active' : 'tab'}
            onClick={() => setActive(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
      <div className="library-body">{tabs[active]}</div>
    </section>
  )
}
