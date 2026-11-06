import { useEffect } from 'react'
import { t } from '@shared/i18n'
import type { Overlay } from '@shared/live'

export interface Shortcuts {
  onToggleOverlay: (overlay: Exclude<Overlay, 'none'>) => void
  onClearOverlay: () => void
  onOpenSettings: () => void
  onShowHelp: () => void
  onSendPreview: () => void
  onStepLive: (delta: number) => void
  onJumpLive: (key: string) => void
  onMovePreview: (delta: number) => void
  onMoveSchedule: (delta: number) => void
  onAddToSchedule: () => void
  onFocusSearch: () => void
  onNewSchedule: () => void
  onOpenSchedule: () => void
  onSaveSchedule: (saveAs: boolean) => void
}

const NEXT_KEYS = new Set(['ArrowRight', 'PageDown', ' '])
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'PageUp'])
const OVERLAY_KEYS: Record<string, Exclude<Overlay, 'none'>> = { F5: 'black', F6: 'clear', F7: 'logo' }
// 1–9 for verses, C chorus, B bridge, E ending, P pre-chorus, T tag.
const JUMP_KEY = /^[1-9cbept]$/i

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

// Ctrl+letter shortcuts, which work even while typing in a search box.
function ctrlShortcut(event: KeyboardEvent, shortcuts: Shortcuts): (() => void) | null {
  if (!event.ctrlKey || event.altKey) return null
  switch (event.key.toLowerCase()) {
    case ',':
      return shortcuts.onOpenSettings
    case 'f':
      return shortcuts.onFocusSearch
    case 't':
      return shortcuts.onAddToSchedule
    case 'n':
      return shortcuts.onNewSchedule
    case 'o':
      return shortcuts.onOpenSchedule
    case 's':
      return () => shortcuts.onSaveSchedule(event.shiftKey)
    default:
      return null
  }
}

// Keyboard shortcuts from the PRD (section 6), so a whole service can run
// from the keyboard or a presentation clicker (which sends PageUp/PageDown).
//
// F5–F7, Esc, F1, and the Ctrl shortcuts work everywhere, even while typing,
// because they must always be reachable during a service. The keys for
// moving slides only work when the operator is not typing.
export function useLiveShortcuts(shortcuts: Shortcuts, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent): void => {
      const typing = isTyping(event.target)
      const plain = !event.ctrlKey && !event.altKey && !event.metaKey
      const run = (action: () => void): void => {
        event.preventDefault()
        action()
      }

      const overlay = OVERLAY_KEYS[event.key]
      if (overlay) return run(() => shortcuts.onToggleOverlay(overlay))
      if (event.key === 'Escape') return shortcuts.onClearOverlay()
      if (event.key === 'F1') return run(shortcuts.onShowHelp)
      const ctrl = ctrlShortcut(event, shortcuts)
      if (ctrl) return run(ctrl)

      if (event.key === 'Enter' && (event.ctrlKey || !typing)) {
        // On ordinary buttons Enter keeps its normal meaning (click). Slide
        // thumbnails and schedule rows opt in, so "pick it, press Enter"
        // sends it to Live.
        if (event.target instanceof HTMLButtonElement && !event.target.dataset.enterSends) return
        return run(shortcuts.onSendPreview)
      }

      if (typing || !plain) return
      if (event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        return run(() => shortcuts.onMovePreview(event.key === 'ArrowRight' ? 1 : -1))
      }
      if (NEXT_KEYS.has(event.key)) return run(() => shortcuts.onStepLive(1))
      if (PREVIOUS_KEYS.has(event.key)) return run(() => shortcuts.onStepLive(-1))
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        return run(() => shortcuts.onMoveSchedule(event.key === 'ArrowDown' ? 1 : -1))
      }
      if (JUMP_KEY.test(event.key) && !event.repeat) return run(() => shortcuts.onJumpLive(event.key.toLowerCase()))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcuts, enabled])
}

// The list shown in the help dialog (F1).
export function shortcutHelp(): Array<{ keys: string; action: string }> {
  return [
    { keys: t('Panah kanan · Page Down · Spasi'), action: t('Slide Live berikutnya (juga tombol clicker)') },
    { keys: t('Panah kiri · Page Up'), action: t('Slide Live sebelumnya') },
    {
      keys: '1–9 · C · B · E · P · T',
      action: t('Lompat ke Verse 1–9, Chorus, Bridge, Ending, Pre-Chorus, Tag di Live')
    },
    { keys: t('Panah atas · bawah'), action: t('Item Schedule sebelumnya/berikutnya (terbuka di Preview)') },
    { keys: t('Shift + panah kiri/kanan'), action: t('Pilih slide di Preview') },
    { keys: 'Enter', action: t('Kirim Preview ke Live') },
    { keys: 'F5 · F6 · F7', action: t('Black · Clear · Logo (tekan lagi untuk kembali)') },
    { keys: 'Esc', action: t('Keluar dari Black, Clear, atau Logo') },
    { keys: 'Ctrl+F', action: t('Fokus ke kolom cari') },
    { keys: 'Ctrl+T', action: t('Tambahkan isi Preview ke Schedule') },
    { keys: 'Ctrl+N · Ctrl+O', action: t('Schedule baru · Buka schedule') },
    { keys: 'Ctrl+S · Ctrl+Shift+S', action: t('Simpan · Simpan sebagai') },
    { keys: t('Delete · Ctrl+D · Alt+panah'), action: t('Di Schedule: hapus · duplikat · pindahkan item') },
    { keys: 'Ctrl+,', action: t('Pengaturan') },
    { keys: 'F1', action: t('Daftar pintasan ini') }
  ]
}
