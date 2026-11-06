import { useEffect } from 'react'
import type { Overlay } from '@shared/live'

interface Shortcuts {
  onToggleOverlay: (overlay: Exclude<Overlay, 'none'>) => void
  onClearOverlay: () => void
  onSendPreview: () => void
  onOpenSettings: () => void
}

const OVERLAY_KEYS: Record<string, Exclude<Overlay, 'none'>> = { F5: 'black', F6: 'clear', F7: 'logo' }

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

// Keyboard shortcuts from the PRD. F5–F7 and Esc work everywhere, even while
// typing, because they must always be reachable during a service. Enter only
// sends the preview when the operator is not typing.
export function useLiveShortcuts(shortcuts: Shortcuts, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent): void => {
      const overlay = OVERLAY_KEYS[event.key]
      if (overlay) {
        event.preventDefault()
        shortcuts.onToggleOverlay(overlay)
      } else if (event.key === 'Escape') {
        shortcuts.onClearOverlay()
      } else if (event.ctrlKey && event.key === ',') {
        event.preventDefault()
        shortcuts.onOpenSettings()
      } else if (event.key === 'Enter' && (event.ctrlKey || !isTyping(event.target))) {
        if (event.target instanceof HTMLButtonElement) return
        event.preventDefault()
        shortcuts.onSendPreview()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcuts, enabled])
}
