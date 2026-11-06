import type { LiveState, Slide } from '@shared/live'
import type { NewScheduleItem } from '@shared/schedule'
import { SlideRenderer } from '../../../shared/SlideRenderer'
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
    <>
      <div className="slide-frame">
        <SlideRenderer slide={selected} style={live.style} overlay="none" logoUrl={live.logoUrl} />
      </div>

      {title ? (
        <>
          <div className="preview-head">
            <strong
              draggable={scheduleItem !== null}
              onDragStart={(e) => scheduleItem && dragNewItem(e, scheduleItem)}
              className={scheduleItem ? 'draggable' : undefined}
              title={scheduleItem ? 'Seret ke Schedule' : undefined}
            >
              {title}
            </strong>
            <span className="muted">
              {selected?.label} · {selectedIndex + 1}/{slides.length}
            </span>
            {scheduleItem && (
              <button type="button" className="btn" onClick={onAddToSchedule} title="Tambahkan ke Schedule (Ctrl+T)">
                + Schedule
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selected}
              onClick={() => onSend(selectedIndex)}
              title="Kirim slide terpilih ke TV"
            >
              Kirim ke Live <kbd>Enter</kbd>
            </button>
          </div>
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
        </>
      ) : (
        <p className="empty">
          Pilih item di Schedule, atau lagu dan ayat di Pustaka, untuk melihat slidenya. Shift+panah memilih slide.
        </p>
      )}
    </>
  )
}
