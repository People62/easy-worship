import { useState } from 'react'
import type { MediaItem } from '@shared/ipc'
import type { Slide } from '@shared/live'
import { DEFAULT_THEMES, themeKindLabel, THEME_KINDS, type Theme, type ThemeInput, type ThemeKind } from '@shared/theme'
import type { AppSettings, SettingsPatch } from '@shared/settings'
import { SlideRenderer } from '../../../shared/SlideRenderer'
import { CopyIcon, EditIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { errorMessage } from '../errors'
import { ThemeEditorDialog } from './ThemeEditorDialog'
import { t } from '@shared/i18n'

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

// "New song theme", per kind, so each reads naturally in both languages.
function newThemeLabel(kind: ThemeKind): string {
  return { song: t('Tema lagu baru'), bible: t('Tema Alkitab baru'), text: t('Tema teks baru') }[kind]
}

type Editing = (ThemeInput & { id?: number }) | null

export function ThemeLibrary({ themes, media, defaults, onSetDefault }: ThemeLibraryProps): React.JSX.Element {
  const [editing, setEditing] = useState<Editing>(null)
  const [error, setError] = useState<string | null>(null)

  const remove = async (theme: Theme): Promise<void> => {
    if (!window.confirm(t('Hapus tema "{name}"?', { name: theme.name }))) return
    try {
      await window.api.themes.delete(theme.id)
      setError(null)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const [kind, setKind] = useState<ThemeKind>('song')

  return (
    <div className="theme-library">
      <div className="library-toolbar">
        <div className="segmented" role="tablist" aria-label={t('Jenis tema')}>
          {THEME_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === kind}
              className={k === kind ? 'btn btn-sm btn-active' : 'btn btn-sm'}
              onClick={() => setKind(k)}
            >
              {themeKindLabel(k)}
              <span className="count">{themes.filter((t) => t.kind === k).length}</span>
            </button>
          ))}
        </div>
        <span className="spacer" />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setEditing({ ...DEFAULT_THEMES[kind], name: newThemeLabel(kind) })}
        >
          <PlusIcon />
          {newThemeLabel(kind)}
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
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
                <span className="theme-name" title={theme.name}>
                  <span className="truncate">{theme.name}</span>
                  {isDefault && <span className="default-badge">{t('Default')}</span>}
                </span>
                <span className="card-actions">
                  <button type="button" className="btn btn-sm" onClick={() => setEditing(theme)}>
                    <EditIcon />
                    {t('Ubah')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm icon-only"
                    title={t('Salin tema')}
                    onClick={() => setEditing({ name: `${theme.name} (salinan)`, kind, style: theme.style })}
                  >
                    <CopyIcon />
                    <span className="sr-only">{t('Salin')}</span>
                  </button>
                  {!isDefault && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      title={t('Jadikan default')}
                      onClick={() => onSetDefault({ [kind]: theme.id })}
                    >
                      {t('Default')}
                    </button>
                  )}
                  <span className="spacer" />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger icon-only"
                    title={t('Hapus tema')}
                    onClick={() => void remove(theme)}
                  >
                    <TrashIcon />
                    <span className="sr-only">{t('Hapus')}</span>
                  </button>
                </span>
              </li>
            )
          })}
      </ul>

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
