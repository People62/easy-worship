import { screen, type Display } from 'electron'
import type { DisplayInfo } from '@shared/ipc'

export function toDisplayInfo(display: Display, primaryId: number, index: number): DisplayInfo {
  const isPrimary = display.id === primaryId
  const name = display.label?.trim() || `Layar ${index + 1}`
  return {
    id: display.id,
    label: isPrimary ? `${name} (layar utama)` : name,
    width: display.size.width,
    height: display.size.height,
    isPrimary
  }
}

export function listDisplays(): DisplayInfo[] {
  const primaryId = screen.getPrimaryDisplay().id
  return screen.getAllDisplays().map((display, index) => toDisplayInfo(display, primaryId, index))
}

// Calls back whenever a monitor or TV is plugged in, unplugged, or changed.
export function watchDisplays(onChange: (displays: DisplayInfo[]) => void): void {
  const notify = (): void => onChange(listDisplays())
  screen.on('display-added', notify)
  screen.on('display-removed', notify)
  screen.on('display-metrics-changed', notify)
}
