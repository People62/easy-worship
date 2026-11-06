import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { EventChannel, EventContract, InvokeChannel, InvokeContract } from '@shared/ipc'

function invoke<C extends InvokeChannel>(
  channel: C,
  ...args: InvokeContract[C]['args']
): Promise<InvokeContract[C]['result']> {
  return ipcRenderer.invoke(channel, ...args)
}

function on<C extends EventChannel>(channel: C, listener: (payload: EventContract[C]) => void): () => void {
  const wrapped = (_event: IpcRendererEvent, payload: EventContract[C]): void => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.removeListener(channel, wrapped)
}

// The only API the renderer can reach. Grouped by area so calls read like
// `window.api.settings.update(...)`.
const api = {
  app: {
    getInfo: () => invoke('app:get-info')
  },
  settings: {
    get: () => invoke('settings:get'),
    update: (...args: InvokeContract['settings:update']['args']) => invoke('settings:update', ...args),
    onChanged: (listener: (settings: EventContract['settings:changed']) => void) => on('settings:changed', listener)
  },
  displays: {
    list: () => invoke('displays:list'),
    onChanged: (listener: (displays: EventContract['displays:changed']) => void) => on('displays:changed', listener)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
