import { useEffect, useMemo, useState } from 'react'
import { formatReference, parseReference } from '@shared/bible/reference'
import type { BiblePassage, BibleVersionInfo } from '@shared/ipc'
import { errorMessage } from '../errors'

interface BibleLibraryProps {
  versionId: number | null
  onVersionChange: (id: number | null) => void
  onOpenPassage: (passage: BiblePassage) => void
}

const RECENT_LIMIT = 8

function useBibleVersions(): BibleVersionInfo[] | null {
  const [versions, setVersions] = useState<BibleVersionInfo[] | null>(null)
  useEffect(() => {
    void window.api.bible.listVersions().then(setVersions)
    return window.api.bible.onVersionsChanged(setVersions)
  }, [])
  return versions
}

export function BibleLibrary({ versionId, onVersionChange, onOpenPassage }: BibleLibraryProps): React.JSX.Element {
  const versions = useBibleVersions()
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const [managing, setManaging] = useState(false)

  const active = versions?.find((v) => v.id === versionId) ?? versions?.[0] ?? null
  const parsed = useMemo(() => (query.trim() ? parseReference(query) : null), [query])

  const open = async (text: string): Promise<void> => {
    if (!active || !text.trim()) return
    try {
      const passage = await window.api.bible.getPassage(active.id, text)
      onOpenPassage(passage)
      setError(null)
      setRecent((list) => [text.trim(), ...list.filter((r) => r !== text.trim())].slice(0, RECENT_LIMIT))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const importBible = async (): Promise<void> => {
    try {
      const result = await window.api.bible.importFile()
      if (!result) return
      const skipped = result.skippedBooks > 0 ? ` ${result.skippedBooks} kitab di luar 66 kitab dilewati.` : ''
      setNotice(
        `${result.version.name} (${result.version.abbreviation}) berhasil diimpor: ${result.version.verseCount.toLocaleString('id-ID')} ayat.${skipped}`
      )
      setError(null)
      onVersionChange(result.version.id)
    } catch (err) {
      setError(`Gagal mengimpor: ${errorMessage(err)}`)
    }
  }

  if (versions === null) return <p className="empty">Memuat…</p>

  if (versions.length === 0) {
    return (
      <div className="bible-empty">
        <p>
          Belum ada Alkitab. Impor file Alkitab dalam format <strong>Zefania XML</strong>, <strong>OSIS</strong>, atau{' '}
          <strong>OpenSong</strong>.
        </p>
        <p className="hint">
          Terjemahan Baru (TB) milik Lembaga Alkitab Indonesia dan berhak cipta, jadi tidak disertakan di aplikasi.
          Gunakan file yang Anda miliki izinnya. Untuk mencoba, terjemahan domain publik seperti KJV bisa dipakai.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => void importBible()}>
          Impor Alkitab…
        </button>
        {error && <p className="field-error">{error}</p>}
      </div>
    )
  }

  return (
    <div className="bible-library">
      <div className="library-toolbar">
        <select
          className="select version-select"
          value={active?.id ?? ''}
          aria-label="Terjemahan"
          onChange={(event) => onVersionChange(Number(event.target.value))}
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.abbreviation} · {v.name}
            </option>
          ))}
        </select>
        <input
          className="search"
          type="search"
          value={query}
          placeholder="Ketik ayat, contoh: yoh 3:16-18, mzm 23, 1kor 13:4"
          aria-label="Referensi ayat"
          aria-invalid={parsed?.ok === false}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.stopPropagation()
              void open(query)
            }
          }}
        />
        <button type="button" className="btn btn-primary" disabled={!parsed?.ok} onClick={() => void open(query)}>
          Tampilkan
        </button>
        <button type="button" className="btn" onClick={() => setManaging((m) => !m)}>
          {managing ? 'Selesai' : 'Kelola'}
        </button>
      </div>

      <div className="reference-hint" aria-live="polite">
        {parsed?.ok && <span>{formatReference(parsed.reference)}</span>}
        {parsed && !parsed.ok && (
          <span className="warn-text">
            {parsed.error}
            {parsed.suggestions.length > 1 &&
              parsed.suggestions.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  className="chip"
                  onClick={() =>
                    setQuery(query.replace(/^\s*([1-3]\s*)?[\p{L}][\p{L}\s.-]*?(?=\s*\d|$)/u, `${book.abbreviation} `))
                  }
                >
                  {book.name}
                </button>
              ))}
          </span>
        )}
        {!parsed && recent.length > 0 && (
          <span className="recent">
            Terakhir:
            {recent.map((r) => (
              <button key={r} type="button" className="chip" onClick={() => void open(r)}>
                {r}
              </button>
            ))}
          </span>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      {managing && <VersionManager versions={versions} onImport={() => void importBible()} onError={setError} />}
    </div>
  )
}

function VersionManager({
  versions,
  onImport,
  onError
}: {
  versions: BibleVersionInfo[]
  onImport: () => void
  onError: (message: string | null) => void
}): React.JSX.Element {
  return (
    <div className="version-manager">
      <ul>
        {versions.map((v) => (
          <VersionRow key={`${v.id}:${v.name}:${v.abbreviation}`} version={v} onError={onError} />
        ))}
      </ul>
      <button type="button" className="btn" onClick={onImport}>
        + Impor Alkitab lain…
      </button>
    </div>
  )
}

function VersionRow({
  version,
  onError
}: {
  version: BibleVersionInfo
  onError: (message: string | null) => void
}): React.JSX.Element {
  const [name, setName] = useState(version.name)
  const [abbreviation, setAbbreviation] = useState(version.abbreviation)
  const changed = name !== version.name || abbreviation !== version.abbreviation

  const run = async (action: () => Promise<unknown>): Promise<void> => {
    try {
      await action()
      onError(null)
    } catch (err) {
      onError(errorMessage(err))
    }
  }

  return (
    <li className="version-row">
      <input
        value={abbreviation}
        onChange={(e) => setAbbreviation(e.target.value)}
        aria-label="Singkatan"
        maxLength={12}
      />
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nama terjemahan" maxLength={200} />
      <span className="muted">{version.verseCount.toLocaleString('id-ID')} ayat</span>
      <button
        type="button"
        className="btn"
        disabled={!changed}
        onClick={() => void run(() => window.api.bible.renameVersion(version.id, name, abbreviation))}
      >
        Simpan
      </button>
      <button
        type="button"
        className="btn"
        onClick={() => {
          if (window.confirm(`Hapus ${version.name} (${version.abbreviation}) dari aplikasi?`)) {
            void run(() => window.api.bible.deleteVersion(version.id))
          }
        }}
      >
        Hapus
      </button>
    </li>
  )
}
