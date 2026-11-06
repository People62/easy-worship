import { BrowserWindow, screen } from 'electron'
import { chooseOutput, type OutputStatus } from '@shared/output'
import type { AppSettings } from '@shared/settings'
import { listDisplays } from '../displays'

interface OutputManagerOptions {
  preloadPath: string
  loadPage: (window: BrowserWindow) => void
  getSettings: () => AppSettings
  onStatus: (status: OutputStatus) => void
}

const WINDOWED_SIZE = { width: 960, height: 540 }

// Owns the output window (what the TVs show). It decides where the window
// goes, follows HDMI being plugged in or out, and makes sure a full-screen
// output never ends up on the laptop screen.
export class OutputManager {
  private window: BrowserWindow | null = null
  private status: OutputStatus = { state: 'none', reason: 'no-external-display' }
  private mode: 'fullscreen' | 'windowed' | null = null

  constructor(private readonly options: OutputManagerOptions) {}

  getStatus(): OutputStatus {
    return this.status
  }

  start(): void {
    // When a display disappears, Windows moves its windows to the laptop
    // screen. Hide first, decide after, so the slide never flashes there.
    screen.on('display-removed', () => {
      if (this.mode === 'fullscreen') this.window?.hide()
      this.reconcile()
    })
    screen.on('display-added', () => this.reconcile())
    screen.on('display-metrics-changed', () => this.reconcile())
    this.reconcile()
  }

  // Applies the current displays and settings to the output window.
  reconcile(): void {
    const { output } = this.options.getSettings()
    const next = chooseOutput(listDisplays(), { windowed: output.windowed, preferredDisplayId: output.displayId })

    if (next.state === 'none') {
      this.destroyWindow()
    } else if (next.state === 'windowed') {
      this.showWindowed()
    } else {
      this.showFullscreen(next.display.id)
    }
    this.setStatus(next)
  }

  destroy(): void {
    this.destroyWindow()
  }

  private showFullscreen(displayId: number): void {
    const display = screen.getAllDisplays().find((d) => d.id === displayId)
    if (!display) return this.destroyWindow()

    const window = this.ensureWindow('fullscreen')
    window.setBounds(display.bounds)
    if (!window.isVisible()) window.showInactive()
  }

  private showWindowed(): void {
    const window = this.ensureWindow('windowed')
    if (!window.isVisible()) window.show()
  }

  private ensureWindow(mode: 'fullscreen' | 'windowed'): BrowserWindow {
    if (this.window && !this.window.isDestroyed() && this.mode === mode) return this.window
    this.destroyWindow()

    const fullscreen = mode === 'fullscreen'
    const window = new BrowserWindow({
      ...(fullscreen ? {} : WINDOWED_SIZE),
      title: 'El-Gibbor Worship · Output',
      show: false,
      frame: !fullscreen,
      resizable: !fullscreen,
      movable: !fullscreen,
      minimizable: !fullscreen,
      maximizable: !fullscreen,
      // A full-screen output must never take keyboard focus from the operator.
      focusable: !fullscreen,
      skipTaskbar: fullscreen,
      alwaysOnTop: fullscreen,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      webPreferences: {
        preload: this.options.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false
      }
    })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', (event) => event.preventDefault())

    if (fullscreen) {
      // Safety net: if anything moves the output onto the laptop screen, hide it.
      window.on('moved', () => this.guardPrimary(window))
      window.on('resized', () => this.guardPrimary(window))
    } else {
      // Closing the test window turns window mode off until it is reopened.
      window.on('closed', () => {
        if (this.window === window) {
          this.window = null
          this.mode = null
          this.setStatus({ state: 'none', reason: 'output-off' })
        }
      })
    }

    this.options.loadPage(window)
    this.window = window
    this.mode = mode
    return window
  }

  private guardPrimary(window: BrowserWindow): void {
    if (window.isDestroyed() || this.mode !== 'fullscreen') return
    const onDisplay = screen.getDisplayMatching(window.getBounds())
    if (onDisplay.id === screen.getPrimaryDisplay().id) {
      window.hide()
      this.reconcile()
    }
  }

  private destroyWindow(): void {
    const window = this.window
    this.window = null
    this.mode = null
    if (window && !window.isDestroyed()) window.destroy()
  }

  private setStatus(status: OutputStatus): void {
    if (JSON.stringify(status) === JSON.stringify(this.status)) return
    this.status = status
    this.options.onStatus(status)
  }
}
