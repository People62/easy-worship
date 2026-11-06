import { useState } from 'react'
import type { SongSummary } from '@shared/songs'
import { dragNewItem } from '../schedule/drag'
import { useSongSearch } from './useSongSearch'

interface SongLibraryProps {
  selectedId: number | null
  onSelect: (song: SongSummary) => void
  onCreate: () => void
  onEdit: (id: number) => void
  onDelete: (song: SongSummary) => void
}

export function SongLibrary({ selectedId, onSelect, onCreate, onEdit, onDelete }: SongLibraryProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const { results, error } = useSongSearch(query)
  const selected = results.find((song) => song.id === selectedId) ?? null

  return (
    <div className="song-library">
      <div className="library-toolbar">
        <input
          className="search"
          type="search"
          value={query}
          placeholder="Cari judul, lirik, atau kata kunci (contoh: NKB 12)…"
          aria-label="Cari lagu"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // Enter in the search box opens the best match in Preview.
            if (event.key === 'Enter' && results[0]) {
              event.preventDefault()
              event.stopPropagation()
              onSelect(results[0])
            }
          }}
        />
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          + Lagu baru
        </button>
        <button type="button" className="btn" disabled={!selected} onClick={() => selected && onEdit(selected.id)}>
          Ubah
        </button>
        <button type="button" className="btn" disabled={!selected} onClick={() => selected && onDelete(selected)}>
          Hapus
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}

      {results.length === 0 ? (
        <p className="empty">
          {query.trim() ? `Tidak ada lagu yang cocok dengan "${query.trim()}".` : 'Belum ada lagu. Klik "+ Lagu baru".'}
        </p>
      ) : (
        <ul className="song-list" role="listbox" aria-label="Daftar lagu">
          {results.map((song) => (
            <li key={song.id} role="option" aria-selected={song.id === selectedId}>
              <button
                type="button"
                className={song.id === selectedId ? 'song-row selected' : 'song-row'}
                draggable
                onDragStart={(e) => dragNewItem(e, { kind: 'song', songId: song.id, title: song.title })}
                onClick={() => onSelect(song)}
                onDoubleClick={() => onEdit(song.id)}
                title="Klik untuk Preview, seret ke Schedule, klik dua kali untuk mengubah"
              >
                <span className="song-title">{song.title}</span>
                <span className="song-first-line">{song.firstLine}</span>
                {song.author && <span className="song-author">{song.author}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
