import { useState } from 'react'
import type { RecentSchedule } from '@shared/ipc'
import { SCHEDULE_KIND_LABELS, type ScheduleItem } from '@shared/schedule'
import { dragRow, isScheduleDrag, readDrop } from './drag'
import { selectedIndex, type ScheduleActions, type ScheduleState } from './useSchedule'

interface SchedulePanelProps {
  schedule: ScheduleState
  actions: ScheduleActions
  recent: RecentSchedule[]
  // uid of the item that is on Live, to mark it.
  liveUid: string | null
  onOpenItem: (item: ScheduleItem) => void
  onNewText: () => void
  onEditText: (index: number) => void
  onError: (error: unknown) => void
}

// Small letters shown before each item, so the kinds are easy to tell apart.
const KIND_MARK: Record<ScheduleItem['kind'], string> = { song: 'L', bible: 'A', media: 'M', text: 'T' }

export function SchedulePanel(props: SchedulePanelProps): React.JSX.Element {
  const { schedule, actions, recent, liveUid, onOpenItem, onNewText, onEditText, onError } = props
  const [dropAt, setDropAt] = useState<number | null>(null)
  const [recentOpen, setRecentOpen] = useState(false)
  const selected = selectedIndex(schedule)

  const guard = (action: () => Promise<unknown>): void => void action().catch(onError)

  // Where a drop lands: before the row under the pointer, or after it when
  // the pointer is in its lower half.
  const dropIndex = (event: React.DragEvent, index: number): number => {
    const box = event.currentTarget.getBoundingClientRect()
    return event.clientY > box.top + box.height / 2 ? index + 1 : index
  }

  const onDragOver = (event: React.DragEvent, at: number): void => {
    if (!isScheduleDrag(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === 'move' ? 'move' : 'copy'
    setDropAt(at)
  }

  const onDrop = (event: React.DragEvent, at: number): void => {
    event.preventDefault()
    event.stopPropagation()
    setDropAt(null)
    const drop = readDrop(event)
    if (drop?.kind === 'new') actions.add(drop.item, at)
    else if (drop?.kind === 'row') actions.move(drop.index, at)
  }

  const open = (index: number): void => {
    const item = schedule.items[index]
    if (!item) return
    actions.select(index)
    onOpenItem(item)
  }

  const onRowKey = (event: React.KeyboardEvent, index: number): void => {
    if (event.key === 'Delete') {
      event.preventDefault()
      actions.remove(index)
    } else if (event.key === 'd' && event.ctrlKey) {
      event.preventDefault()
      actions.duplicate(index)
    } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      // Alt+Up/Down moves the item itself.
      event.preventDefault()
      actions.move(index, event.key === 'ArrowUp' ? index - 1 : index + 2)
    }
  }

  return (
    <div className="schedule">
      <div className="schedule-head">
        <strong className="schedule-name" title={schedule.path ?? 'Belum disimpan'}>
          {schedule.name}
          {schedule.dirty && <span className="dirty-mark" title="Belum disimpan" aria-label="belum disimpan" />}
        </strong>
        <div className="schedule-toolbar">
          <button type="button" className="btn" onClick={() => actions.reset()} title="Schedule baru (Ctrl+N)">
            Baru
          </button>
          <button type="button" className="btn" onClick={() => guard(actions.open)} title="Buka schedule (Ctrl+O)">
            Buka
          </button>
          <button
            type="button"
            className="btn"
            aria-expanded={recentOpen}
            disabled={recent.length === 0}
            onClick={() => setRecentOpen((o) => !o)}
            title="Schedule terakhir"
          >
            ▾<span className="sr-only">Schedule terakhir</span>
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => guard(() => actions.save())}
            title="Simpan (Ctrl+S). Simpan sebagai: Ctrl+Shift+S"
          >
            Simpan
          </button>
        </div>
      </div>

      {recentOpen && (
        <ul className="recent-schedules" aria-label="Schedule terakhir">
          {recent.map((r) => (
            <li key={r.path}>
              <button
                type="button"
                className="recent-row"
                disabled={!r.exists}
                title={r.exists ? r.path : `File tidak ditemukan: ${r.path}`}
                onClick={() => {
                  setRecentOpen(false)
                  guard(() => actions.openRecent(r.path))
                }}
              >
                <span>{r.name}</span>
                <span className="muted">{r.exists ? new Date(r.openedAt).toLocaleDateString('id-ID') : 'hilang'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ol
        className={dropAt === schedule.items.length ? 'schedule-list drop-end' : 'schedule-list'}
        aria-label="Urutan ibadah"
        onDragOver={(e) => onDragOver(e, schedule.items.length)}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropAt(null)
        }}
        onDrop={(e) => onDrop(e, dropAt ?? schedule.items.length)}
      >
        {schedule.items.map((item, index) => (
          <li
            key={item.uid}
            className={dropAt === index ? 'schedule-row-wrap drop-before' : 'schedule-row-wrap'}
            onDragOver={(e) => {
              e.stopPropagation()
              onDragOver(e, dropIndex(e, index))
            }}
            onDrop={(e) => onDrop(e, dropIndex(e, index))}
          >
            <button
              type="button"
              draggable
              data-schedule-row={index}
              // Enter on a row sends the item (already open in Preview) to Live.
              data-enter-sends="true"
              className={[
                'schedule-row',
                index === selected ? 'selected' : '',
                item.uid === liveUid ? 'is-live' : ''
              ].join(' ')}
              onDragStart={(e) => dragRow(e, index)}
              onDragEnd={() => setDropAt(null)}
              onClick={() => open(index)}
              onDoubleClick={() => item.kind === 'text' && onEditText(index)}
              onKeyDown={(e) => onRowKey(e, index)}
              title={`${SCHEDULE_KIND_LABELS[item.kind]}: ${item.title}`}
            >
              <span className={`kind-mark kind-${item.kind}`} aria-label={SCHEDULE_KIND_LABELS[item.kind]}>
                {KIND_MARK[item.kind]}
              </span>
              <span className="schedule-title">{item.title}</span>
              {item.uid === liveUid && <span className="live-dot" aria-label="sedang tampil" />}
            </button>
          </li>
        ))}
        {schedule.items.length === 0 && (
          <li className="schedule-empty">
            Seret lagu, ayat, atau media ke sini. Atau buka item di Preview lalu tekan <kbd>Ctrl+T</kbd>.
          </li>
        )}
      </ol>

      <div className="schedule-actions">
        <button type="button" className="btn" onClick={onNewText} title="Slide teks untuk pengumuman">
          + Teks
        </button>
        <button
          type="button"
          className="btn"
          disabled={selected === null}
          onClick={() => selected !== null && actions.duplicate(selected)}
          title="Duplikat (Ctrl+D)"
        >
          Duplikat
        </button>
        {selected !== null && schedule.items[selected]?.kind === 'text' && (
          <button type="button" className="btn" onClick={() => onEditText(selected)}>
            Ubah
          </button>
        )}
        <button
          type="button"
          className="btn"
          disabled={selected === null}
          onClick={() => selected !== null && actions.remove(selected)}
          title="Hapus dari schedule (Delete)"
        >
          Hapus
        </button>
      </div>
    </div>
  )
}
