import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { EventChannel, EventContract, InvokeChannel, InvokeContract } from '@shared/ipc'

export type Handler<C extends InvokeChannel> = (
  ...args: InvokeContract[C]['args']
) => InvokeContract[C]['result'] | Promise<InvokeContract[C]['result']>

// Only our own pages may call into the main process: the bundled files, or
// the Vite dev server while developing.
function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url ?? ''
  const devServer = process.env['ELECTRON_RENDERER_URL']
  return url.startsWith('file://') || (devServer !== undefined && url.startsWith(devServer))
}

// One handler for every channel in the contract: a missing or extra handler
// is a TypeScript error, so no call can reach main without an answer.
export type Handlers = { [C in InvokeChannel]: Handler<C> }

export function registerHandlers(handlers: Handlers): void {
  for (const channel of Object.keys(handlers) as InvokeChannel[]) {
    const handler = handlers[channel] as (...args: unknown[]) => unknown
    ipcMain.handle(channel, (event, ...args) => {
      if (!isTrustedSender(event)) throw new Error(`Blocked IPC call to ${channel} from ${event.senderFrame?.url}`)
      return handler(...args)
    })
  }
}

export function broadcast<C extends EventChannel>(channel: C, payload: EventContract[C]): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }
}
