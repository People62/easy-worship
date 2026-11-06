// Label shown in the About screen and the window title, e.g. "v0.1.0 (dev)".
export function formatVersionLabel(version: string, isPackaged: boolean): string {
  const clean = version.trim().replace(/^v/i, '')
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(clean)) {
    throw new Error(`Invalid version: "${version}"`)
  }
  return isPackaged ? `v${clean}` : `v${clean} (dev)`
}
