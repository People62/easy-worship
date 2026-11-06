import { useEffect, useRef } from 'react'
import { SHORTCUT_HELP } from '../useLiveShortcuts'

export function ShortcutsDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog ref={dialogRef} className="dialog" onClose={onClose} aria-labelledby="shortcuts-title">
      <header className="dialog-head">
        <h2 id="shortcuts-title">Pintasan keyboard</h2>
        <button type="button" className="btn" onClick={() => dialogRef.current?.close()} autoFocus>
          Tutup
        </button>
      </header>
      <div className="dialog-body">
        <table className="shortcut-table">
          <tbody>
            {SHORTCUT_HELP.map((row) => (
              <tr key={row.keys}>
                <th scope="row">
                  <kbd>{row.keys}</kbd>
                </th>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </dialog>
  )
}
