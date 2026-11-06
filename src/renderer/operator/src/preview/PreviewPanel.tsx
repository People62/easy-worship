import type { LiveState, Slide } from '@shared/live'
import { SlideRenderer } from '../../../shared/SlideRenderer'

interface PreviewPanelProps {
  // Song title or Bible passage, or null when nothing is open.
  title: string | null
  slides: Slide[]
  selectedIndex: number
  liveSlideId: string | null
  live: LiveState
  onSelect: (index: number) => void
  onSend: (index: number) => void
}

export function PreviewPanel(props: PreviewPanelProps): React.JSX.Element {
  const { title, slides, selectedIndex, liveSlideId, live, onSelect, onSend } = props
  const selected = slides[selectedIndex] ?? null

  return (
    <>
      <div className="slide-frame">
        <SlideRenderer slide={selected} style={live.style} overlay="none" logoUrl={live.logoUrl} />
      </div>

      {title ? (
        <>
          <div className="preview-head">
            <strong>{title}</strong>
            <span className="muted">
              {selected?.label} · {selectedIndex + 1}/{slides.length}
            </span>
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
          Pilih lagu atau ketik ayat di Pustaka untuk melihat slidenya. Panah kiri/kanan memilih slide.
        </p>
      )}
    </>
  )
}
