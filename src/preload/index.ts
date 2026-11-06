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
  },
  live: {
    get: () => invoke('live:get'),
    show: (...args: InvokeContract['live:show']['args']) => invoke('live:show', ...args),
    showDeck: (...args: InvokeContract['live:show-deck']['args']) => invoke('live:show-deck', ...args),
    goTo: (...args: InvokeContract['live:go-to']['args']) => invoke('live:go-to', ...args),
    step: (...args: InvokeContract['live:step']['args']) => invoke('live:step', ...args),
    toggleOverlay: (...args: InvokeContract['live:toggle-overlay']['args']) => invoke('live:toggle-overlay', ...args),
    clearOverlay: () => invoke('live:clear-overlay'),
    onChanged: (listener: (state: EventContract['live:changed']) => void) => on('live:changed', listener)
  },
  output: {
    getStatus: () => invoke('output:get-status'),
    onStatusChanged: (listener: (status: EventContract['output:status-changed']) => void) =>
      on('output:status-changed', listener)
  },
  church: {
    chooseLogo: () => invoke('church:choose-logo'),
    removeLogo: () => invoke('church:remove-logo')
  },
  songs: {
    search: (...args: InvokeContract['songs:search']['args']) => invoke('songs:search', ...args),
    get: (...args: InvokeContract['songs:get']['args']) => invoke('songs:get', ...args),
    create: (...args: InvokeContract['songs:create']['args']) => invoke('songs:create', ...args),
    update: (...args: InvokeContract['songs:update']['args']) => invoke('songs:update', ...args),
    delete: (...args: InvokeContract['songs:delete']['args']) => invoke('songs:delete', ...args),
    onChanged: (listener: (id: EventContract['songs:changed']) => void) => on('songs:changed', listener)
  },
  bible: {
    listVersions: () => invoke('bible:list-versions'),
    importFile: () => invoke('bible:import'),
    renameVersion: (...args: InvokeContract['bible:rename-version']['args']) => invoke('bible:rename-version', ...args),
    deleteVersion: (...args: InvokeContract['bible:delete-version']['args']) => invoke('bible:delete-version', ...args),
    getPassage: (...args: InvokeContract['bible:get-passage']['args']) => invoke('bible:get-passage', ...args),
    onVersionsChanged: (listener: (versions: EventContract['bible:versions-changed']) => void) =>
      on('bible:versions-changed', listener)
  },
  media: {
    list: () => invoke('media:list'),
    importFiles: () => invoke('media:import'),
    setInfo: (...args: InvokeContract['media:set-info']['args']) => invoke('media:set-info', ...args),
    rename: (...args: InvokeContract['media:rename']['args']) => invoke('media:rename', ...args),
    delete: (...args: InvokeContract['media:delete']['args']) => invoke('media:delete', ...args),
    onChanged: (listener: (items: EventContract['media:changed']) => void) => on('media:changed', listener)
  },
  themes: {
    list: () => invoke('themes:list'),
    create: (...args: InvokeContract['themes:create']['args']) => invoke('themes:create', ...args),
    update: (...args: InvokeContract['themes:update']['args']) => invoke('themes:update', ...args),
    delete: (...args: InvokeContract['themes:delete']['args']) => invoke('themes:delete', ...args),
    onChanged: (listener: (themes: EventContract['themes:changed']) => void) => on('themes:changed', listener)
  },
  schedule: {
    open: () => invoke('schedule:open'),
    openRecent: (...args: InvokeContract['schedule:open-recent']['args']) => invoke('schedule:open-recent', ...args),
    save: (...args: InvokeContract['schedule:save']['args']) => invoke('schedule:save', ...args),
    listRecent: () => invoke('schedule:list-recent'),
    onRecentChanged: (listener: (recent: EventContract['schedule:recent-changed']) => void) =>
      on('schedule:recent-changed', listener)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
