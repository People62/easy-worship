import { useState } from 'react'
import type { RecentSchedule } from '@shared/ipc'
import { scheduleKindLabel, type ScheduleItem } from '@shared/schedule'
import {
  BookIcon,
  ChevronDownIcon,
  CopyIcon,
  EditIcon,
  FileIcon,
  FolderIcon,
  ImageIcon,
  MusicIcon,
  PlusIcon,
  SaveIcon,
  TextIcon,
  TrashIcon
} from '../components/Icons'
import { dragRow, isScheduleDrag, readDrop } from './drag'
import { selectedIndex, type ScheduleActions, type ScheduleState } from './useSchedule'
import { locale, t } from '@shared/i18n'

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

// An icon per kind, so the kinds are easy to tell apart at a glance.
const KIND_ICON: Record<ScheduleItem['kind'], (props: { size?: number }) => React.JSX.Element> = {
  song: MusicIcon,
  bible: BookIcon,
  media: ImageIcon,
  text: TextIcon
}

function KindIcon({ kind }: { kind: ScheduleItem['kind'] }): React.JSX.Element {
  const Icon = KIND_ICON[kind]
  return <Icon />
}

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
        <div className="schedule-name" title={schedule.path ?? 'Belum pernah disimpan'}>
          <strong>{schedule.name ?? t('Schedule baru')}</strong>
          <span className={schedule.dirty ? 'save-state dirty' : 'save-state'}>
            {schedule.dirty ? t('Belum disimpan') : schedule.path ? t('Tersimpan') : t('Kosong')}
          </span>
        </div>
        <button
          type="button"
          className={schedule.dirty ? 'btn btn-sm btn-attention' : 'btn btn-sm'}
          onClick={() => guard(() => actions.save())}
          title={t('Simpan (Ctrl+S). Simpan sebagai: Ctrl+Shift+S')}
        >
          <SaveIcon />
          {t('Simpan')}
        </button>
      </div>
      <div className="schedule-toolbar">
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => actions.reset()}
          title={t('Schedule baru (Ctrl+N)')}
        >
          <FileIcon />
          {t('Baru')}
        </button>
        <span className="btn-group">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => guard(actions.open)}
            title={t('Buka schedule (Ctrl+O)')}
          >
            <FolderIcon />
            {t('Buka')}
          </button>
          <button
            type="button"
            className="btn btn-sm icon-only"
            aria-expanded={recentOpen}
            disabled={recent.length === 0}
            onClick={() => setRecentOpen((o) => !o)}
            title={t('Schedule terakhir')}
          >
            <ChevronDownIcon />
            <span className="sr-only">{t('Schedule terakhir')}</span>
          </button>
        </span>
      </div>

      {recentOpen && (
        <ul className="recent-schedules" aria-label={t('Schedule terakhir')}>
          {recent.map((r) => (
            <li key={r.path}>
              <button
                type="button"
                className="recent-row"
                disabled={!r.exists}
                title={r.exists ? r.path : t('File tidak ditemukan: {path}', { path: r.path })}
                onClick={() => {
                  setRecentOpen(false)
                  guard(() => actions.openRecent(r.path))
                }}
              >
                <span>{r.name}</span>
                <span className="muted">
                  {r.exists ? new Date(r.openedAt).toLocaleDateString(locale()) : t('hilang')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ol
        className={dropAt === schedule.items.length ? 'schedule-list drop-end' : 'schedule-list'}
        aria-label={t('Urutan ibadah')}
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
              title={`${scheduleKindLabel(item.kind)}: ${item.title}`}
            >
              <span className={`kind-mark kind-${item.kind}`} aria-label={scheduleKindLabel(item.kind)}>
                <KindIcon kind={item.kind} />
              </span>
              <span className="schedule-title">{item.title}</span>
              {item.uid === liveUid && <span className="live-dot" aria-label={t('sedang tampil')} />}
            </button>
          </li>
        ))}
        {schedule.items.length === 0 && (
          <li className="schedule-empty">
            {t('Seret lagu, ayat, atau media ke sini, atau buka item di Preview lalu tekan')} <kbd>Ctrl+T</kbd>.
          </li>
        )}
      </ol>

      <div className="schedule-actions">
        <button type="button" className="btn btn-sm" onClick={onNewText} title={t('Slide teks untuk pengumuman')}>
          <PlusIcon />
          {t('Teks')}
        </button>
        <span className="spacer" />
        {selected !== null && schedule.items[selected]?.kind === 'text' && (
          <button
            type="button"
            className="btn btn-sm icon-only"
            onClick={() => onEditText(selected)}
            title={t('Ubah slide teks')}
          >
            <EditIcon />
            <span className="sr-only">{t('Ubah')}</span>
          </button>
        )}
        <button
          type="button"
          className="btn btn-sm icon-only"
          disabled={selected === null}
          onClick={() => selected !== null && actions.duplicate(selected)}
          title={t('Duplikat (Ctrl+D)')}
        >
          <CopyIcon />
          <span className="sr-only">{t('Duplikat')}</span>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-danger icon-only"
          disabled={selected === null}
          onClick={() => selected !== null && actions.remove(selected)}
          title={t('Hapus dari schedule (Delete)')}
        >
          <TrashIcon />
          <span className="sr-only">{t('Hapus')}</span>
        </button>
      </div>
    </div>
  )
}
