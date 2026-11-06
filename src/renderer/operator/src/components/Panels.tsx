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
  { id: 'songs', label: 'Lagu', placeholder: 'Cari judul atau lirik…', empty: 'Belum ada lagu. Tersedia di Tahap 3.' },
  { id: 'bible', label: 'Alkitab', placeholder: 'Contoh: yoh 3:16', empty: 'Belum ada Alkitab. Tersedia di Tahap 4.' },
  {
    id: 'media',
    label: 'Media',
    placeholder: 'Cari gambar atau video…',
    empty: 'Belum ada media. Tersedia di Tahap 5.'
  },
  { id: 'themes', label: 'Tema', placeholder: 'Cari tema…', empty: 'Belum ada tema. Tersedia di Tahap 5.' }
] as const

type LibraryTabId = (typeof LIBRARY_TABS)[number]['id']

export function Library(): React.JSX.Element {
  const [active, setActive] = useState<LibraryTabId>('songs')
  const tab = LIBRARY_TABS.find((t) => t.id === active) ?? LIBRARY_TABS[0]

  return (
    <section className="panel library" aria-label="Pustaka">
      <div className="library-head">
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
        <input className="search" type="search" placeholder={tab.placeholder} disabled aria-label={tab.placeholder} />
      </div>
      <EmptyState>{tab.empty}</EmptyState>
    </section>
  )
}
