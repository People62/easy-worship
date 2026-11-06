import { useEffect, useMemo, useRef, useState } from 'react'
import { buildSongSlides } from '@shared/slides'
import { formatLyrics, parseLyrics, sectionLabel, type Song, type SongInput } from '@shared/songs'
import { errorMessage } from '../errors'

interface SongEditorDialogProps {
  // null = new song.
  song: Song | null
  linesPerSlide: number
  onSaved: (song: Song) => void
  onClose: () => void
}

const NEW_SONG_LYRICS = '[Verse 1]\n\n\n[Reff]\n\n'

interface Draft {
  title: string
  author: string
  keywords: string
  copyright: string
  ccli: string
  lyrics: string
}

function toDraft(song: Song | null): Draft {
  if (!song) return { title: '', author: '', keywords: '', copyright: '', ccli: '', lyrics: NEW_SONG_LYRICS }
  return {
    title: song.title,
    author: song.author,
    keywords: song.keywords,
    copyright: song.copyright,
    ccli: song.ccli,
    lyrics: formatLyrics(song.sections)
  }
}

export function SongEditorDialog({ song, linesPerSlide, onSaved, onClose }: SongEditorDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState<Draft>(() => toDraft(song))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const sections = useMemo(() => parseLyrics(draft.lyrics), [draft.lyrics])
  const slideCount = useMemo(
    () => buildSongSlides({ id: 0, sections }, linesPerSlide).length,
    [sections, linesPerSlide]
  )
  const set = (field: keyof Draft) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [field]: event.target.value }))

  const save = async (): Promise<void> => {
    const input: SongInput = { ...draft, sections }
    setSaving(true)
    try {
      const saved = song ? await window.api.songs.update(song.id, input) : await window.api.songs.create(input)
      onSaved(saved)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog dialog-wide"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 's' && event.ctrlKey) {
          event.preventDefault()
          void save()
        }
      }}
      aria-labelledby="song-editor-title"
    >
      <header className="dialog-head">
        <h2 id="song-editor-title">{song ? 'Ubah lagu' : 'Lagu baru'}</h2>
        <div className="row">
          <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>
            Batal
          </button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            Simpan <kbd>Ctrl+S</kbd>
          </button>
        </div>
      </header>

      <div className="dialog-body song-editor">
        <div className="song-fields">
          <label className="field field-wide">
            <span>Judul *</span>
            <input value={draft.title} onChange={set('title')} autoFocus maxLength={200} />
          </label>
          <label className="field">
            <span>Pengarang</span>
            <input value={draft.author} onChange={set('author')} maxLength={200} />
          </label>
          <label className="field">
            <span>Kata kunci</span>
            <input
              value={draft.keywords}
              onChange={set('keywords')}
              placeholder="Contoh: NKB 12, natal"
              maxLength={500}
            />
          </label>
          <label className="field">
            <span>Hak cipta</span>
            <input value={draft.copyright} onChange={set('copyright')} maxLength={300} />
          </label>
          <label className="field">
            <span>Nomor CCLI</span>
            <input value={draft.ccli} onChange={set('ccli')} maxLength={20} />
          </label>
        </div>

        <div className="lyrics-area">
          <label className="field lyrics-field">
            <span>Lirik</span>
            <textarea value={draft.lyrics} onChange={set('lyrics')} spellCheck={false} />
          </label>
          <aside className="lyrics-help">
            <h3>Penanda bagian</h3>
            <p>
              Tulis di baris sendiri: <code>[Verse 1]</code> atau <code>[Bait 1]</code>, <code>[Reff]</code> atau{' '}
              <code>[Chorus]</code>, <code>[Pre Reff]</code>, <code>[Bridge]</code>, <code>[Ending]</code>.
            </p>
            <p>Baris kosong di dalam satu bagian = pindah slide.</p>
            <h3>Hasil</h3>
            <p>
              {sections.length} bagian · {slideCount} slide (maks. {linesPerSlide} baris per slide)
            </p>
            <ul className="section-chips">
              {sections.map((section, index) => (
                <li key={index}>
                  {sectionLabel(section)} · {section.text.split('\n').filter((l) => l.trim()).length} baris
                </li>
              ))}
            </ul>
          </aside>
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
