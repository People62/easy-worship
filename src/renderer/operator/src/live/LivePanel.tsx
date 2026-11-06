import type { LiveState } from '@shared/live'
import { SlideRenderer } from '../../../shared/SlideRenderer'

const OVERLAY_NOTES = {
  black: 'Layar hitam aktif. Tekan F5 atau Esc untuk kembali.',
  clear: 'Teks disembunyikan. Tekan F6 atau Esc untuk kembali.',
  logo: 'Logo tampil. Tekan F7 atau Esc untuk kembali.'
} as const

// Exactly what the TVs show, plus every slide of the item on Live so the
// operator can see what comes next and click to jump.
export function LivePanel({ live }: { live: LiveState }): React.JSX.Element {
  const deck = live.deck
  const count = deck?.slides.length ?? 0

  return (
    <>
      <div className="slide-frame">
        <SlideRenderer slide={live.slide} style={live.style} overlay={live.overlay} logoUrl={live.logoUrl} />
      </div>

      <div className="preview-head">
        <strong>{deck?.title || (live.slide ? 'Live' : 'Live kosong')}</strong>
        {count > 0 && (
          <span className="muted">
            {live.slide?.label} · {live.index + 1}/{count}
          </span>
        )}
        <span className="row live-nav">
          <button
            type="button"
            className="btn"
            disabled={!deck || live.index === 0}
            onClick={() => void window.api.live.step(-1)}
            title="Slide sebelumnya (panah kiri, Page Up)"
          >
            ‹<span className="sr-only">Sebelumnya</span>
          </button>
          <button
            type="button"
            className="btn"
            disabled={!deck || live.index >= count - 1}
            onClick={() => void window.api.live.step(1)}
            title="Slide berikutnya (panah kanan, Page Down, Spasi)"
          >
            ›<span className="sr-only">Berikutnya</span>
          </button>
          <button
            type="button"
            className="btn"
            disabled={!live.slide}
            onClick={() => void window.api.live.show(null)}
            title="Kosongkan Live"
          >
            Kosongkan
          </button>
        </span>
      </div>

      {live.overlay !== 'none' && <p className="live-note">{OVERLAY_NOTES[live.overlay]}</p>}

      {deck && count > 1 ? (
        <ol className="slide-grid" aria-label="Slide di Live">
          {deck.slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                type="button"
                className={index === live.index ? 'slide-thumb is-live' : 'slide-thumb'}
                onClick={() => void window.api.live.goTo(index)}
                title="Klik untuk menampilkan slide ini"
              >
                <span className="thumb-frame">
                  <SlideRenderer slide={slide} style={live.style} overlay="none" logoUrl={null} />
                </span>
                <span className="thumb-label">
                  {index === live.index && <span className="live-dot" aria-label="sedang tampil" />}
                  {slide.label}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        live.overlay === 'none' && (
          <p className="empty">
            {live.slide ? 'Sama dengan di TV jemaat.' : 'Pilih item di Schedule atau Pustaka, lalu tekan Enter.'}
          </p>
        )
      )}
    </>
  )
}
