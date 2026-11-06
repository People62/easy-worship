import { useEffect, useRef, useState } from 'react'
import { isHexColor, normalizeHex } from '@shared/color'
import type { AppInfo, DisplayInfo } from '@shared/ipc'
import {
  DEFAULT_SETTINGS,
  PRIMARY_PRESETS,
  type AppSettings,
  type SettingsPatch,
  type ThemeMode
} from '@shared/settings'
import { MAX_LINES_PER_SLIDE, MIN_LINES_PER_SLIDE } from '@shared/slides'
import { CheckIcon } from './Icons'
import { LANGUAGES, t } from '@shared/i18n'

interface SettingsDialogProps {
  open: boolean
  settings: AppSettings
  logoUrl: string | null
  error: string | null
  onUpdate: (patch: SettingsPatch) => void
  onChooseLogo: () => void
  onRemoveLogo: () => void
  onClose: () => void
}

function modes(): ReadonlyArray<{ value: ThemeMode; label: string; hint: string }> {
  return [
    { value: 'dark', label: t('Gelap'), hint: t('Untuk ruangan gelap') },
    { value: 'light', label: t('Terang'), hint: t('Untuk ruangan terang') },
    { value: 'system', label: t('Ikuti Windows'), hint: t('Sama dengan pengaturan Windows') }
  ]
}

// Names of the preset colors, by hex value.
function presetName(value: string): string {
  const names: Record<string, string> = {
    '#D4A017': t('Emas'),
    '#2563EB': t('Biru'),
    '#16A34A': t('Hijau'),
    '#0D9488': t('Toska'),
    '#7C3AED': t('Ungu'),
    '#9F1239': t('Marun'),
    '#EA580C': t('Oranye'),
    '#64748B': t('Abu')
  }
  return names[value] ?? value
}

function useDisplays(): DisplayInfo[] {
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  useEffect(() => {
    void window.api.displays.list().then(setDisplays)
    return window.api.displays.onChanged(setDisplays)
  }, [])
  return displays
}

function useAppInfo(): AppInfo | null {
  const [info, setInfo] = useState<AppInfo | null>(null)
  useEffect(() => {
    void window.api.app.getInfo().then(setInfo)
  }, [])
  return info
}

export function SettingsDialog({
  open,
  settings,
  logoUrl,
  error,
  onUpdate,
  onChooseLogo,
  onRemoveLogo,
  onClose
}: SettingsDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const displays = useDisplays()
  const info = useAppInfo()
  const { mode, primary } = settings.appearance
  // While the operator types a hex code, show the draft; otherwise the saved color.
  const [draft, setDraft] = useState<string | null>(null)
  const hexDraft = draft ?? primary
  const commitHex = (): void => {
    if (isHexColor(hexDraft) && normalizeHex(hexDraft) !== primary) onUpdate({ appearance: { primary: hexDraft } })
    setDraft(null)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const hexValid = isHexColor(hexDraft)
  const isPreset = PRIMARY_PRESETS.some((p) => p.value === primary)
  const isDefault = mode === DEFAULT_SETTINGS.appearance.mode && primary === DEFAULT_SETTINGS.appearance.primary

  return (
    <dialog ref={dialogRef} className="dialog" onClose={onClose} aria-labelledby="settings-title">
      <header className="dialog-head">
        <h2 id="settings-title">{t('Pengaturan')}</h2>
        <button type="button" className="btn" onClick={onClose}>
          {t('Tutup')}
        </button>
      </header>

      <div className="dialog-body">
        <section className="setting-group">
          {/* Shown in both languages, so it can be found whichever is active. */}
          <h3>{t('Bahasa')} · Language</h3>
          <div className="segmented" role="radiogroup" aria-label="Bahasa / Language">
            {LANGUAGES.map((language) => (
              <button
                key={language.value}
                type="button"
                role="radio"
                aria-checked={settings.general.language === language.value}
                className={settings.general.language === language.value ? 'btn btn-active' : 'btn'}
                onClick={() => onUpdate({ general: { language: language.value } })}
              >
                {language.label}
              </button>
            ))}
          </div>
          <p className="hint">{t('Bahasa jendela operator dan pesan. Isi slide (lirik, ayat) tidak diterjemahkan.')}</p>
        </section>

        <section className="setting-group">
          <h3>{t('Mode tampilan')}</h3>
          <p className="hint">{t('Hanya mengubah jendela operator. Tampilan di TV jemaat diatur lewat Tema.')}</p>
          <div className="choice-row" role="radiogroup" aria-label={t('Mode tampilan')}>
            {modes().map((m) => (
              <label key={m.value} className={m.value === mode ? 'choice selected' : 'choice'}>
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={m.value === mode}
                  onChange={() => onUpdate({ appearance: { mode: m.value } })}
                />
                <strong>{m.label}</strong>
                <span>{m.hint}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="setting-group">
          <h3>{t('Warna primer')}</h3>
          <div className="swatches" role="radiogroup" aria-label={t('Warna primer')}>
            {PRIMARY_PRESETS.map((preset) => {
              const selected = preset.value === primary
              return (
                <button
                  key={preset.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={selected ? 'swatch selected' : 'swatch'}
                  onClick={() => onUpdate({ appearance: { primary: preset.value } })}
                >
                  <span className="swatch-dot" style={{ background: preset.value }}>
                    {selected && <CheckIcon />}
                  </span>
                  {presetName(preset.value)}
                </button>
              )
            })}
          </div>
          <div className="custom-color">
            <label className={isPreset ? 'swatch' : 'swatch selected'}>
              <span
                className={isPreset ? 'swatch-dot swatch-custom' : 'swatch-dot'}
                style={isPreset ? undefined : { background: primary }}
              >
                {!isPreset && <CheckIcon />}
                <input
                  type="color"
                  value={primary.toLowerCase()}
                  onChange={(event) => onUpdate({ appearance: { primary: event.target.value } })}
                  aria-label={t('Pilih warna bebas')}
                />
              </span>
              {t('Bebas')}
            </label>
            <input
              className={hexValid ? 'hex-input' : 'hex-input invalid'}
              value={hexDraft}
              spellCheck={false}
              maxLength={7}
              aria-label={t('Kode warna hex')}
              aria-invalid={!hexValid}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitHex}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitHex()
                if (event.key === 'Escape') setDraft(null)
              }}
            />
            {!hexValid && <span className="field-error">{t('Format: #RRGGBB, contoh #D4A017')}</span>}
          </div>
          <button
            type="button"
            className="btn"
            disabled={isDefault}
            onClick={() => onUpdate({ appearance: { ...DEFAULT_SETTINGS.appearance } })}
          >
            {t('Kembalikan ke default (emas, gelap)')}
          </button>
        </section>

        <section className="setting-group">
          <h3>{t('Layar output')}</h3>
          <p className="hint">
            {t(
              'Layar yang menampilkan slide ke jemaat (HDMI ke TV). Layar laptop tidak pernah dipakai sebagai output.'
            )}
          </p>
          <select
            className="select"
            value={settings.output.displayId ?? ''}
            onChange={(event) =>
              onUpdate({ output: { displayId: event.target.value === '' ? null : Number(event.target.value) } })
            }
          >
            <option value="">{t('Pilih otomatis (layar selain layar utama)')}</option>
            {displays
              .filter((d) => !d.isPrimary)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} · {d.width}×{d.height}
                </option>
              ))}
          </select>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.output.windowed}
              onChange={(event) => onUpdate({ output: { windowed: event.target.checked } })}
            />
            <span>
              <strong>{t('Mode jendela')}</strong>
              <span className="hint-inline">
                {t('Output tampil di jendela biasa, untuk uji coba tanpa proyektor atau TV.')}
              </span>
            </span>
          </label>
        </section>

        <section className="setting-group">
          <h3>{t('Lagu')}</h3>
          <label className="field field-inline">
            <span>{t('Baris lirik per slide')}</span>
            <input
              type="number"
              min={MIN_LINES_PER_SLIDE}
              max={MAX_LINES_PER_SLIDE}
              value={settings.songs.linesPerSlide}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (Number.isInteger(value) && value >= MIN_LINES_PER_SLIDE && value <= MAX_LINES_PER_SLIDE) {
                  onUpdate({ songs: { linesPerSlide: value } })
                }
              }}
            />
          </label>
          <p className="hint">{t('Bagian lagu yang lebih panjang dibagi rata ke beberapa slide.')}</p>
        </section>

        <section className="setting-group">
          <h3>{t('Logo gereja')}</h3>
          <p className="hint">{t('Tampil di TV saat tombol Logo (F7) ditekan. Gambar disalin ke folder aplikasi.')}</p>
          <div className="logo-row">
            <div className="logo-preview">
              {logoUrl ? (
                <img src={logoUrl} alt={t('Logo gereja')} />
              ) : (
                <span>{t('Belum ada logo (memakai ikon EG)')}</span>
              )}
            </div>
            <div className="logo-actions">
              <button type="button" className="btn" onClick={onChooseLogo}>
                {logoUrl ? t('Ganti logo…') : t('Pilih logo…')}
              </button>
              {logoUrl && (
                <button type="button" className="btn" onClick={onRemoveLogo}>
                  {t('Hapus logo')}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="setting-group">
          <h3>{t('Tentang aplikasi')}</h3>
          {info ? (
            <dl className="about">
              <dt>{t('Versi')}</dt>
              <dd>{info.version}</dd>
              <dt>Electron</dt>
              <dd>{info.electron}</dd>
              <dt>{t('Database')}</dt>
              <dd>
                {info.database.ok
                  ? `SQLite ${info.database.sqliteVersion} · skema v${info.database.schemaVersion}`
                  : t('Gagal: {error}', { error: info.database.error })}
              </dd>
              <dt>{t('Lisensi')}</dt>
              <dd>GPL-3.0 · © 2026 People62 · {t('Dibuat untuk GPdI El-Gibbor')}</dd>
            </dl>
          ) : (
            <p className="hint">{t('Memuat…')}</p>
          )}
        </section>

        {error && (
          <p className="field-error" role="alert">
            Gagal menyimpan: {error}
          </p>
        )}
      </div>
    </dialog>
  )
}
