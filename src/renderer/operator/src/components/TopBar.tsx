import type { Overlay } from '@shared/live'
import { describeOutput, type OutputStatus } from '@shared/output'
import type { ResolvedMode } from '../theme/tokens'
import { EgIcon } from '../EgIcon'
import { GearIcon, MoonIcon, SunIcon } from './Icons'

interface TopBarProps {
  mode: ResolvedMode
  overlay: Overlay
  outputStatus: OutputStatus | null
  onToggleOverlay: (overlay: Exclude<Overlay, 'none'>) => void
  onToggleMode: () => void
  onOpenSettings: () => void
  onShowHelp: () => void
}

const LIVE_CONTROLS: ReadonlyArray<{ overlay: Exclude<Overlay, 'none'>; label: string; key: string; hint: string }> = [
  { overlay: 'black', label: 'Black', key: 'F5', hint: 'Layar hitam' },
  { overlay: 'clear', label: 'Clear', key: 'F6', hint: 'Sembunyikan teks, latar tetap' },
  { overlay: 'logo', label: 'Logo', key: 'F7', hint: 'Tampilkan logo gereja' }
]

export function TopBar(props: TopBarProps): React.JSX.Element {
  const { mode, overlay, outputStatus, onToggleOverlay, onToggleMode, onOpenSettings, onShowHelp } = props
  const nextLabel = mode === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'
  const outputOk = outputStatus !== null && outputStatus.state !== 'none'

  return (
    <header className="topbar">
      <div className="brand">
        <EgIcon size={22} />
        <span>El-Gibbor Worship</span>
      </div>

      {outputStatus && (
        <span className={outputOk ? 'output-status' : 'output-status warn'} role="status">
          {describeOutput(outputStatus)}
        </span>
      )}

      <div className="topbar-actions">
        {LIVE_CONTROLS.map((control) => {
          const active = overlay === control.overlay
          return (
            <button
              key={control.overlay}
              type="button"
              className={active ? 'btn btn-active' : 'btn'}
              aria-pressed={active}
              title={`${control.hint} (${control.key}). Tekan lagi atau Esc untuk kembali.`}
              onClick={() => onToggleOverlay(control.overlay)}
            >
              {control.label}
              <kbd>{control.key}</kbd>
            </button>
          )
        })}
        <span className="divider" aria-hidden />
        <button type="button" className="btn" onClick={onToggleMode} title={nextLabel} aria-label={nextLabel}>
          {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
          {mode === 'dark' ? 'Gelap' : 'Terang'}
        </button>
        <button type="button" className="btn icon-only" onClick={onShowHelp} title="Pintasan keyboard (F1)">
          ?<span className="sr-only">Pintasan keyboard</span>
        </button>
        <button type="button" className="btn icon-only" onClick={onOpenSettings} title="Pengaturan (Ctrl+,)">
          <GearIcon />
          <span className="sr-only">Pengaturan</span>
        </button>
      </div>
    </header>
  )
}
