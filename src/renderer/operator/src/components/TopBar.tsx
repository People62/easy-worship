import type { ResolvedMode } from '../theme/tokens'
import { EgIcon } from '../EgIcon'
import { GearIcon, MoonIcon, SunIcon } from './Icons'

interface TopBarProps {
  mode: ResolvedMode
  onToggleMode: () => void
  onOpenSettings: () => void
}

const LIVE_CONTROLS = ['Black', 'Clear', 'Logo'] as const

export function TopBar({ mode, onToggleMode, onOpenSettings }: TopBarProps): React.JSX.Element {
  const nextLabel = mode === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'
  return (
    <header className="topbar">
      <div className="brand">
        <EgIcon size={22} />
        <span>El-Gibbor Worship</span>
      </div>

      <div className="topbar-actions">
        {LIVE_CONTROLS.map((label) => (
          <button key={label} type="button" className="btn" disabled title="Tersedia di Tahap 2">
            {label}
          </button>
        ))}
        <span className="divider" aria-hidden />
        <button type="button" className="btn" onClick={onToggleMode} title={nextLabel} aria-label={nextLabel}>
          {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
          {mode === 'dark' ? 'Gelap' : 'Terang'}
        </button>
        <button type="button" className="btn icon-only" onClick={onOpenSettings} title="Pengaturan (Ctrl+,)">
          <GearIcon />
          <span className="sr-only">Pengaturan</span>
        </button>
      </div>
    </header>
  )
}
