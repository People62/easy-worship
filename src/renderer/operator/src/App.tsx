import { useEffect, useState } from 'react'
import type { AppInfo } from '@shared/ipc'
import { EgIcon } from './EgIcon'

// Phase 0 placeholder: proves that React, the preload bridge, and SQLite all work.
export function App(): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    void window.api.getAppInfo().then(setInfo)
  }, [])

  return (
    <main className="splash">
      <EgIcon size={96} />
      <h1>El-Gibbor Worship</h1>
      {info ? (
        <dl>
          <dt>Versi</dt>
          <dd>{info.version}</dd>
          <dt>Electron</dt>
          <dd>{info.electron}</dd>
          <dt>Database</dt>
          <dd>{info.database.ok ? `SQLite ${info.database.sqliteVersion}` : `Gagal: ${info.database.error}`}</dd>
        </dl>
      ) : (
        <p>Memuat…</p>
      )}
    </main>
  )
}
