import { useState } from 'react'
import type { MediaItem } from '@shared/ipc'
import { errorMessage } from '../errors'
import { failedThumbnails } from './useMedia'

interface MediaLibraryProps {
  items: MediaItem[] | null
  selectedId: number | null
  onSelect: (item: MediaItem) => void
}

function formatDuration(ms: number | null): string {
  if (!ms) return ''
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// Videos above 1080p can stutter on the 4 GB church laptop (PRD NF-03).
function isTooLarge(item: Pick<MediaItem, 'kind' | 'width' | 'height'>): boolean {
  return item.kind === 'video' && (item.width ?? 0) * (item.height ?? 0) > 1920 * 1080
}

export function MediaLibrary({ items, selectedId, onSelect }: MediaLibraryProps): React.JSX.Element {
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [renaming, setRenaming] = useState<MediaItem | null>(null)
  const selected = items?.find((item) => item.id === selectedId) ?? null

  const run = async (action: () => Promise<void>): Promise<void> => {
    try {
      await action()
    } catch (err) {
      setMessage({ text: errorMessage(err), error: true })
    }
  }

  const importFiles = (): Promise<void> =>
    run(async () => {
      const result = await window.api.media.importFiles()
      if (!result) return
      const failed = result.failed.map((f) => `${f.file}: ${f.error}`).join(' · ')
      setMessage({
        text: `${result.imported.length} file diimpor.${failed ? ` Gagal: ${failed}` : ''}`,
        error: result.failed.length > 0
      })
    })

  if (items === null) return <p className="empty">Memuat…</p>

  return (
    <div className="media-library">
      <div className="library-toolbar">
        <button type="button" className="btn btn-primary" onClick={() => void importFiles()}>
          + Impor gambar/video…
        </button>
        <button type="button" className="btn" disabled={!selected} onClick={() => setRenaming(selected)}>
          Ganti nama
        </button>
        <button
          type="button"
          className="btn"
          disabled={!selected}
          onClick={() => {
            if (
              selected &&
              window.confirm(`Hapus "${selected.name}"? Tema yang memakai media ini akan berlatar hitam.`)
            ) {
              void run(() => window.api.media.delete(selected.id))
            }
          }}
        >
          Hapus
        </button>
        <span className="muted media-hint">Gambar: JPG, PNG, WEBP · Video: MP4 (H.264), WEBM · maksimal 1080p</span>
      </div>

      {message && <p className={message.error ? 'field-error' : 'notice'}>{message.text}</p>}
      {renaming && (
        <RenameRow
          item={renaming}
          onDone={() => setRenaming(null)}
          onError={(text) => setMessage({ text, error: true })}
        />
      )}

      {items.length === 0 ? (
        <p className="empty">Belum ada media. Impor gambar atau video untuk dipakai sebagai latar.</p>
      ) : (
        <ul className="media-grid" aria-label="Media">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={item.id === selectedId ? 'media-card selected' : 'media-card'}
                onClick={() => onSelect(item)}
                title="Klik untuk Preview"
              >
                <span className="media-thumb">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" draggable={false} />
                  ) : (
                    <span className="muted">{failedThumbnails.has(item.id) ? 'Tidak bisa dibaca' : 'Memuat…'}</span>
                  )}
                  {item.kind === 'video' && <span className="media-badge">▶ {formatDuration(item.durationMs)}</span>}
                </span>
                <span className="media-name">{item.name}</span>
                <span className="media-meta">
                  {item.width && item.height ? `${item.width}×${item.height} · ` : ''}
                  {formatSize(item.sizeBytes)}
                  {isTooLarge(item) && <span className="warn-text"> · di atas 1080p</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RenameRow({
  item,
  onDone,
  onError
}: {
  item: MediaItem
  onDone: () => void
  onError: (text: string) => void
}): React.JSX.Element {
  const [name, setName] = useState(item.name)
  const save = async (): Promise<void> => {
    try {
      await window.api.media.rename(item.id, name)
      onDone()
    } catch (err) {
      onError(errorMessage(err))
    }
  }
  return (
    <div className="row rename-row">
      <input
        className="search"
        value={name}
        autoFocus
        aria-label="Nama media"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') void save()
          if (e.key === 'Escape') onDone()
        }}
      />
      <button type="button" className="btn btn-primary" onClick={() => void save()}>
        Simpan
      </button>
      <button type="button" className="btn" onClick={onDone}>
        Batal
      </button>
    </div>
  )
}
