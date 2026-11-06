import { join, relative, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import { isLogoFileName } from '@shared/settings'
import { churchDir } from './church/logo'

// egw://church/<file> serves files from the app's user data folder to the
// windows. Pages cannot read arbitrary disk paths, only what this allows.

export function registerEgwScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'egw', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
  ])
}

// Returns the file path for a URL, or null if the URL asks for anything
// outside the allowed folder.
export function resolveEgwPath(url: string, userDataDir: string): string | null {
  const { host, pathname } = new URL(url)
  if (host !== 'church') return null
  const name = decodeURIComponent(pathname.replace(/^\//, ''))
  if (!isLogoFileName(name)) return null

  const dir = churchDir(userDataDir)
  const file = join(dir, name)
  const rel = relative(dir, file)
  if (rel.startsWith('..') || isAbsolute(rel)) return null
  return file
}

export function handleEgwProtocol(userDataDir: string): void {
  protocol.handle('egw', (request) => {
    const file = resolveEgwPath(request.url, userDataDir)
    if (!file) return new Response('Not found', { status: 404 })
    return net.fetch(pathToFileURL(file).toString())
  })
}
