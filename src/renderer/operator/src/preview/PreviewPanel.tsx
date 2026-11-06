import type { LiveState, Slide } from '@shared/live'
import type { NewScheduleItem } from '@shared/schedule'
import { SlideRenderer } from '../../../shared/SlideRenderer'
import { PlusIcon, SendIcon } from '../components/Icons'
import { dragNewItem } from '../schedule/drag'

interface PreviewPanelProps {
  // Song title or Bible passage, or null when nothing is open.
  title: string | null
  slides: Slide[]
  selectedIndex: number
  liveSlideId: string | null
  live: LiveState
  // What "+ Schedule" adds, or null when the item is already from the schedule.
  scheduleItem: NewScheduleItem | null
  onSelect: (index: number) => void
  onSend: (index: number) => void
  onAddToSchedule: () => void
}

export function PreviewPanel(props: PreviewPanelProps): React.JSX.Element {
  const { title, slides, selectedIndex, liveSlideId, live, scheduleItem, onSelect, onSend, onAddToSchedule } = props
  const selected = slides[selectedIndex] ?? null

  return (
    <div className="deck">
      <div className="deck-head">
        <div className="deck-title">
          <strong
            draggable={scheduleItem !== null}
            onDragStart={(e) => scheduleItem && dragNewItem(e, scheduleItem)}
            className={scheduleItem ? 'draggable' : undefined}
            title={scheduleItem ? `${title} · seret ke Schedule` : (title ?? undefined)}
          >
            {title ?? 'Belum ada item'}
          </strong>
          <span className="deck-meta">
            {title
              ? `${selected?.label ?? ''} · ${selectedIndex + 1}/${slides.length}`
              : 'Pilih dari Schedule atau Pustaka'}
          </span>
        </div>
        <div className="deck-actions">
          {scheduleItem && (
            <button type="button" className="btn" onClick={onAddToSchedule} title="Tambahkan ke Schedule (Ctrl+T)">
              <PlusIcon />
              Schedule
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selected}
            onClick={() => onSend(selectedIndex)}
            title="Kirim ke TV, mulai dari slide terpilih"
          >
            <SendIcon />
            Live <kbd>Enter</kbd>
          </button>
        </div>
      </div>

      <div className="stage">
        <div className="slide-frame">
          <SlideRenderer slide={selected} style={live.style} overlay="none" logoUrl={live.logoUrl} />
        </div>
      </div>

      {title ? (
        <ol className="slide-grid" aria-label="Slide">
          {slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                type="button"
                className={[
                  'slide-thumb',
                  index === selectedIndex ? 'selected' : '',
                  slide.id === liveSlideId ? 'is-live' : ''
                ].join(' ')}
                data-enter-sends="true"
                onClick={() => onSelect(index)}
                onDoubleClick={() => onSend(index)}
                title="Klik untuk memilih, klik dua kali untuk langsung ke Live"
              >
                <span className="thumb-frame">
                  <SlideRenderer slide={slide} style={live.style} overlay="none" logoUrl={null} />
                </span>
                <span className="thumb-label">
                  {slide.id === liveSlideId && <span className="live-dot" aria-label="sedang tampil" />}
                  {slide.label}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty deck-empty">
          Pilih item di Schedule, atau lagu dan ayat di Pustaka, untuk melihat slidenya. Shift+panah memilih slide.
        </p>
      )}
    </div>
  )
}
