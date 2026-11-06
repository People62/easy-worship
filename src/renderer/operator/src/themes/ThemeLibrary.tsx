import { useState } from 'react'
import type { MediaItem } from '@shared/ipc'
import type { Slide } from '@shared/live'
import {
  DEFAULT_THEMES,
  THEME_KIND_LABELS,
  THEME_KINDS,
  type Theme,
  type ThemeInput,
  type ThemeKind
} from '@shared/theme'
import type { AppSettings, SettingsPatch } from '@shared/settings'
import { SlideRenderer } from '../../../shared/SlideRenderer'
import { errorMessage } from '../errors'
import { ThemeEditorDialog } from './ThemeEditorDialog'

interface ThemeLibraryProps {
  themes: Theme[]
  media: MediaItem[]
  defaults: AppSettings['themes']
  onSetDefault: (patch: NonNullable<SettingsPatch['themes']>) => void
}

const SAMPLE: Record<ThemeKind, Slide> = {
  song: { id: 'sample', text: 'Bapa Engkau sungguh baik' },
  bible: { id: 'sample', text: 'Karena begitu besar kasih Allah akan dunia ini', caption: 'Yohanes 3:16' },
  text: { id: 'sample', text: 'Selamat datang' }
}

type Editing = (ThemeInput & { id?: number }) | null

export function ThemeLibrary({ themes, media, defaults, onSetDefault }: ThemeLibraryProps): React.JSX.Element {
  const [editing, setEditing] = useState<Editing>(null)
  const [error, setError] = useState<string | null>(null)

  const remove = async (theme: Theme): Promise<void> => {
    if (!window.confirm(`Hapus tema "${theme.name}"?`)) return
    try {
      await window.api.themes.delete(theme.id)
      setError(null)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="theme-library">
      {error && <p className="field-error">{error}</p>}
      {THEME_KINDS.map((kind) => (
        <section key={kind} className="theme-group">
          <div className="theme-group-head">
            <h3>{THEME_KIND_LABELS[kind]}</h3>
            <button
              type="button"
              className="btn"
              onClick={() => setEditing({ ...DEFAULT_THEMES[kind], name: `${THEME_KIND_LABELS[kind]} baru` })}
            >
              + Tema baru
            </button>
          </div>
          <ul className="theme-grid">
            {themes
              .filter((theme) => theme.kind === kind)
              .map((theme) => {
                const isDefault = defaults[kind] === theme.id
                return (
                  <li key={theme.id} className={isDefault ? 'theme-card is-default' : 'theme-card'}>
                    <span className="thumb-frame">
                      <SlideRenderer
                        slide={{ ...SAMPLE[kind], style: theme.style }}
                        style={theme.style}
                        overlay="none"
                        logoUrl={null}
                      />
                    </span>
                    <span className="theme-name">
                      {theme.name}
                      {isDefault && <span className="default-badge">Default</span>}
                    </span>
                    <span className="row">
                      <button type="button" className="btn" onClick={() => setEditing(theme)}>
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setEditing({ name: `${theme.name} (salinan)`, kind, style: theme.style })}
                      >
                        Salin
                      </button>
                      {!isDefault && (
                        <button type="button" className="btn" onClick={() => onSetDefault({ [kind]: theme.id })}>
                          Jadikan default
                        </button>
                      )}
                      <button type="button" className="btn" onClick={() => void remove(theme)}>
                        Hapus
                      </button>
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}

      {editing && (
        <ThemeEditorDialog
          initial={editing}
          media={media}
          onSaved={() => setEditing(null)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
