import { useEffect, useRef } from 'react'
import { shortcutHelp } from '../useLiveShortcuts'
import { t } from '@shared/i18n'

export function ShortcutsDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog ref={dialogRef} className="dialog" onClose={onClose} aria-labelledby="shortcuts-title">
      <header className="dialog-head">
        <h2 id="shortcuts-title">{t('Pintasan keyboard')}</h2>
        <button type="button" className="btn" onClick={() => dialogRef.current?.close()} autoFocus>
          {t('Tutup')}
        </button>
      </header>
      <div className="dialog-body">
        <table className="shortcut-table">
          <tbody>
            {shortcutHelp().map((row) => (
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
