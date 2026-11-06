import type { DisplayInfo } from './ipc'

export type OutputStatus =
  | { state: 'fullscreen'; display: DisplayInfo }
  | { state: 'windowed' }
  | { state: 'none'; reason: 'no-external-display' | 'output-off' }

export interface OutputChoice {
  windowed: boolean
  preferredDisplayId: number | null
}

// Decides where the output goes. The rule that matters most (PRD F-OT-02):
// outside window mode, the output is never placed on the primary (laptop)
// screen, so the congregation never sees the operator's screen and the
// operator never loses the laptop screen to a full-screen slide.
export function chooseOutput(displays: DisplayInfo[], choice: OutputChoice): OutputStatus {
  if (choice.windowed) return { state: 'windowed' }

  const external = displays.filter((d) => !d.isPrimary)
  if (external.length === 0) return { state: 'none', reason: 'no-external-display' }

  const preferred = external.find((d) => d.id === choice.preferredDisplayId)
  return { state: 'fullscreen', display: preferred ?? external[0] }
}

export function describeOutput(status: OutputStatus): string {
  switch (status.state) {
    case 'fullscreen':
      return `Output: ${status.display.label} · ${status.display.width}×${status.display.height}`
    case 'windowed':
      return 'Output: mode jendela (uji)'
    case 'none':
      return status.reason === 'output-off' ? 'Output: mati' : 'Output: tidak ada layar HDMI'
  }
}
