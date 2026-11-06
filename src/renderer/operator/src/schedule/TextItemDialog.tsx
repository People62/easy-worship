import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SLIDE_STYLE, type SlideStyle } from '@shared/live'
import { MAX_TEXT_LENGTH, MAX_TITLE_LENGTH, textSlides } from '@shared/schedule'
import { SlideRenderer } from '../../../shared/SlideRenderer'

interface TextItemDialogProps {
  // The announcement to edit, or null for a new one.
  initial: { title: string; body: string } | null
  style: SlideStyle | undefined
  onSave: (value: { title: string; body: string }) => void
  onClose: () => void
}

// Free text for announcements (PRD F-SC-05). The title names the item in
// the schedule; the body is what the TVs show, one slide per paragraph.
export function TextItemDialog({ initial, style, onSave, onClose }: TextItemDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const slides = useMemo(() => textSlides({ uid: 'draft', title: title || 'Teks', body }, style), [title, body, style])

  const save = (): void => {
    if (!title.trim()) return setError('Judul wajib diisi.')
    if (slides.length === 0) return setError('Isi teks masih kosong.')
    onSave({ title: title.trim(), body })
  }

  return (
    <dialog ref={dialogRef} className="dialog dialog-wide" onClose={onClose} aria-labelledby="text-item-title">
      <header className="dialog-head">
        <h2 id="text-item-title">{initial ? 'Ubah slide teks' : 'Slide teks baru'}</h2>
        <div className="row">
          <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>
            Batal
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            Simpan
          </button>
        </div>
      </header>

      <div className="dialog-body text-item-editor">
        <div className="text-item-fields">
          <label className="field">
            <span>Judul *</span>
            <input
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Contoh: Pengumuman, Persembahan"
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span>Isi</span>
            <textarea
              className="text-item-body"
              value={body}
              maxLength={MAX_TEXT_LENGTH}
              rows={12}
              placeholder={'Doa malam\nRabu, 19.00 WIB\n\nPersekutuan pemuda\nSabtu, 18.00 WIB'}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  save()
                }
              }}
            />
          </label>
          <p className="hint">Baris kosong memulai slide baru. Ctrl+Enter untuk menyimpan.</p>
        </div>

        <div className="text-item-preview">
          <div className="slide-frame">
            <SlideRenderer
              slide={slides[0] ?? null}
              style={style ?? DEFAULT_SLIDE_STYLE}
              overlay="none"
              logoUrl={null}
            />
          </div>
          <p className="hint">
            {slides.length === 0 ? 'Belum ada slide.' : `${slides.length} slide. Pratinjau slide pertama.`}
          </p>
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </dialog>
  )
}
