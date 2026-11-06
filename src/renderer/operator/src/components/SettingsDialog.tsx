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
import { CheckIcon } from './Icons'

interface SettingsDialogProps {
  open: boolean
  settings: AppSettings
  error: string | null
  onUpdate: (patch: SettingsPatch) => void
  onClose: () => void
}

const MODES: ReadonlyArray<{ value: ThemeMode; label: string; hint: string }> = [
  { value: 'dark', label: 'Gelap', hint: 'Untuk ruangan gelap' },
  { value: 'light', label: 'Terang', hint: 'Untuk ruangan terang' },
  { value: 'system', label: 'Ikuti Windows', hint: 'Sama dengan pengaturan Windows' }
]

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

export function SettingsDialog({ open, settings, error, onUpdate, onClose }: SettingsDialogProps): React.JSX.Element {
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
        <h2 id="settings-title">Pengaturan</h2>
        <button type="button" className="btn" onClick={onClose}>
          Tutup
        </button>
      </header>

      <div className="dialog-body">
        <section className="setting-group">
          <h3>Mode tampilan</h3>
          <p className="hint">Hanya mengubah jendela operator. Tampilan di TV jemaat diatur lewat Tema.</p>
          <div className="choice-row" role="radiogroup" aria-label="Mode tampilan">
            {MODES.map((m) => (
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
          <h3>Warna primer</h3>
          <div className="swatches" role="radiogroup" aria-label="Warna primer">
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
                  {preset.name}
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
                  aria-label="Pilih warna bebas"
                />
              </span>
              Bebas
            </label>
            <input
              className={hexValid ? 'hex-input' : 'hex-input invalid'}
              value={hexDraft}
              spellCheck={false}
              maxLength={7}
              aria-label="Kode warna hex"
              aria-invalid={!hexValid}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitHex}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitHex()
                if (event.key === 'Escape') setDraft(null)
              }}
            />
            {!hexValid && <span className="field-error">Format: #RRGGBB, contoh #D4A017</span>}
          </div>
          <button
            type="button"
            className="btn"
            disabled={isDefault}
            onClick={() => onUpdate({ appearance: { ...DEFAULT_SETTINGS.appearance } })}
          >
            Kembalikan ke default (emas, gelap)
          </button>
        </section>

        <section className="setting-group">
          <h3>Layar output</h3>
          <p className="hint">Layar yang menampilkan slide ke jemaat (HDMI ke TV). Dipakai mulai Tahap 2.</p>
          <select
            className="select"
            value={settings.output.displayId ?? ''}
            onChange={(event) =>
              onUpdate({ output: { displayId: event.target.value === '' ? null : Number(event.target.value) } })
            }
          >
            <option value="">Pilih otomatis (layar selain layar utama)</option>
            {displays.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} · {d.width}×{d.height}
              </option>
            ))}
          </select>
        </section>

        <section className="setting-group">
          <h3>Tentang aplikasi</h3>
          {info ? (
            <dl className="about">
              <dt>Versi</dt>
              <dd>{info.version}</dd>
              <dt>Electron</dt>
              <dd>{info.electron}</dd>
              <dt>Database</dt>
              <dd>
                {info.database.ok
                  ? `SQLite ${info.database.sqliteVersion} · skema v${info.database.schemaVersion}`
                  : `Gagal: ${info.database.error}`}
              </dd>
              <dt>Lisensi</dt>
              <dd>GPL-3.0 · © 2026 People62 · Dibuat untuk GPdI El-Gibbor</dd>
            </dl>
          ) : (
            <p className="hint">Memuat…</p>
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
