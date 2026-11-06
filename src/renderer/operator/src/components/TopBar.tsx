import type { Overlay } from '@shared/live'
import { describeOutput, type OutputStatus } from '@shared/output'
import type { ResolvedMode } from '../theme/tokens'
import { EgIcon } from '../EgIcon'
import { GearIcon, KeyboardIcon, MonitorIcon, MoonIcon, SunIcon } from './Icons'
import { t } from '@shared/i18n'

interface TopBarProps {
  mode: ResolvedMode
  overlay: Overlay
  outputStatus: OutputStatus | null
  onToggleOverlay: (overlay: Exclude<Overlay, 'none'>) => void
  onToggleMode: () => void
  onOpenSettings: () => void
  onShowHelp: () => void
}

const LIVE_CONTROLS = [
  { overlay: 'black', label: 'Black', key: 'F5', hint: 'Layar hitam' },
  { overlay: 'clear', label: 'Clear', key: 'F6', hint: 'Sembunyikan teks, latar tetap' },
  { overlay: 'logo', label: 'Logo', key: 'F7', hint: 'Tampilkan logo gereja' }
] as const satisfies ReadonlyArray<{ overlay: Exclude<Overlay, 'none'>; label: string; key: string; hint: string }>

export function TopBar(props: TopBarProps): React.JSX.Element {
  const { mode, overlay, outputStatus, onToggleOverlay, onToggleMode, onOpenSettings, onShowHelp } = props
  const nextLabel = mode === 'dark' ? t('Ganti ke mode terang') : t('Ganti ke mode gelap')
  const outputOk = outputStatus !== null && outputStatus.state !== 'none'

  return (
    <header className="topbar">
      <div className="brand">
        <EgIcon size={22} />
        <span>El-Gibbor Worship</span>
      </div>

      {outputStatus && (
        <span className={outputOk ? 'output-status ok' : 'output-status warn'} role="status">
          <MonitorIcon size={14} />
          {describeOutput(outputStatus)}
        </span>
      )}

      <div className="topbar-actions">
        <div className="live-controls" role="group" aria-label={t('Kontrol layar TV')}>
          {LIVE_CONTROLS.map((control) => {
            const active = overlay === control.overlay
            return (
              <button
                key={control.overlay}
                type="button"
                className={active ? `btn live-control btn-active is-${control.overlay}` : 'btn live-control'}
                aria-pressed={active}
                title={t('{hint} ({key}). Tekan lagi atau Esc untuk kembali.', {
                  hint: t(control.hint),
                  key: control.key
                })}
                onClick={() => onToggleOverlay(control.overlay)}
              >
                {control.label}
                <kbd>{control.key}</kbd>
              </button>
            )
          })}
        </div>
        <span className="divider" aria-hidden />
        <button type="button" className="btn btn-ghost icon-only" onClick={onToggleMode} title={nextLabel}>
          {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
          <span className="sr-only">{nextLabel}</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost icon-only"
          onClick={onShowHelp}
          title={t('Pintasan keyboard (F1)')}
        >
          <KeyboardIcon />
          <span className="sr-only">{t('Pintasan keyboard')}</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost icon-only"
          onClick={onOpenSettings}
          title={t('Pengaturan (Ctrl+,)')}
        >
          <GearIcon />
          <span className="sr-only">{t('Pengaturan')}</span>
        </button>
      </div>
    </header>
  )
}
