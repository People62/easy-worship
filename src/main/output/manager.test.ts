import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, type AppSettings } from '@shared/settings'

// Fake Electron screen and windows, so we can plug and unplug HDMI in a test.
type Rect = { x: number; y: number; width: number; height: number }
type FakeDisplay = { id: number; label: string; bounds: Rect; size: { width: number; height: number } }

const fake = vi.hoisted(() => {
  const display = (id: number, label: string, x: number, width: number, height: number) => ({
    id,
    label,
    bounds: { x, y: 0, width, height },
    size: { width, height }
  })
  return {
    laptop: display(1, 'Laptop', 0, 1366, 768),
    hdmi: display(2, 'HDMI', 1366, 1920, 1080),
    displays: [] as FakeDisplay[],
    windows: [] as unknown[]
  }
})

vi.mock('electron', async () => {
  const { EventEmitter } = await vi.importActual<typeof import('node:events')>('node:events')
  const screen = Object.assign(new EventEmitter(), {
    getAllDisplays: () => fake.displays,
    getPrimaryDisplay: () => fake.laptop,
    getDisplayMatching: (rect: Rect) =>
      fake.displays.find((d) => rect.x >= d.bounds.x && rect.x < d.bounds.x + d.bounds.width) ?? fake.laptop
  })

  class BrowserWindow extends EventEmitter {
    bounds: Rect = { x: 100, y: 100, width: 960, height: 540 }
    visible = false
    destroyed = false
    webContents = { setWindowOpenHandler: vi.fn(), on: vi.fn() }
    constructor(public options: Record<string, unknown>) {
      super()
      fake.windows.push(this)
    }
    setBounds(rect: Rect): void {
      this.bounds = rect
    }
    getBounds(): Rect {
      return this.bounds
    }
    show(): void {
      this.visible = true
    }
    showInactive(): void {
      this.visible = true
    }
    hide(): void {
      this.visible = false
    }
    isVisible(): boolean {
      return this.visible
    }
    isDestroyed(): boolean {
      return this.destroyed
    }
    destroy(): void {
      this.destroyed = true
      this.visible = false
      this.emit('closed')
    }
  }

  return { screen, BrowserWindow }
})

const { screen } = await import('electron')
const { OutputManager } = await import('./manager')

type FakeWindow = {
  bounds: Rect
  visible: boolean
  destroyed: boolean
  options: Record<string, unknown>
  emit: (event: string) => void
}

let settings: AppSettings
let statuses: unknown[]

function createManager(): InstanceType<typeof OutputManager> {
  return new OutputManager({
    preloadPath: 'preload.js',
    loadPage: vi.fn(),
    getSettings: () => settings,
    onStatus: (status) => statuses.push(status)
  })
}

const liveWindows = (): FakeWindow[] => (fake.windows as FakeWindow[]).filter((w) => !w.destroyed)

beforeEach(() => {
  fake.displays = [fake.laptop, fake.hdmi]
  fake.windows = []
  screen.removeAllListeners()
  settings = structuredClone(DEFAULT_SETTINGS)
  statuses = []
})

describe('OutputManager', () => {
  it('opens a full-screen, non-focusable output on the HDMI display', () => {
    const manager = createManager()
    manager.start()
    const [window] = liveWindows()
    expect(window.bounds).toEqual(fake.hdmi.bounds)
    expect(window.visible).toBe(true)
    expect(window.options).toMatchObject({ frame: false, focusable: false, skipTaskbar: true })
    expect(manager.getStatus()).toMatchObject({ state: 'fullscreen', display: { id: 2 } })
  })

  it('opens nothing when only the laptop screen exists', () => {
    fake.displays = [fake.laptop]
    const manager = createManager()
    manager.start()
    expect(liveWindows()).toHaveLength(0)
    expect(manager.getStatus()).toEqual({ state: 'none', reason: 'no-external-display' })
  })

  it('removes the output when HDMI is unplugged, without showing it on the laptop', () => {
    const manager = createManager()
    manager.start()
    const [window] = liveWindows()

    // Windows moves the window to the laptop screen as the display disappears.
    window.bounds = { ...fake.laptop.bounds }
    fake.displays = [fake.laptop]
    screen.emit('display-removed')

    expect(window.visible).toBe(false)
    expect(liveWindows()).toHaveLength(0)
    expect(manager.getStatus()).toEqual({ state: 'none', reason: 'no-external-display' })
  })

  it('brings the output back when HDMI is plugged in again', () => {
    const manager = createManager()
    manager.start()
    fake.displays = [fake.laptop]
    screen.emit('display-removed')
    fake.displays = [fake.laptop, fake.hdmi]
    screen.emit('display-added')

    const [window] = liveWindows()
    expect(window.bounds).toEqual(fake.hdmi.bounds)
    expect(window.visible).toBe(true)
    expect(statuses.map((s) => (s as { state: string }).state)).toEqual(['fullscreen', 'none', 'fullscreen'])
  })

  it('moves the output back when something pushes it onto the laptop screen', () => {
    const manager = createManager()
    manager.start()
    const [window] = liveWindows()
    window.bounds = { ...fake.laptop.bounds }
    window.emit('moved')
    expect(window.bounds).toEqual(fake.hdmi.bounds)
    expect(window.visible).toBe(true)
  })

  it('switches to a framed, focusable test window in window mode', () => {
    const manager = createManager()
    manager.start()
    settings.output.windowed = true
    manager.reconcile()

    const windows = liveWindows()
    expect(windows).toHaveLength(1)
    expect(windows[0].options).toMatchObject({ frame: true, focusable: true, width: 960, height: 540 })
    expect(manager.getStatus()).toEqual({ state: 'windowed' })
  })

  it('reports output off when the test window is closed', () => {
    settings.output.windowed = true
    const manager = createManager()
    manager.start()
    const [window] = liveWindows() as unknown as Array<{ emit: (e: string) => void; destroyed: boolean }>
    window.destroyed = true
    window.emit('closed')
    expect(manager.getStatus()).toEqual({ state: 'none', reason: 'output-off' })
  })
})
