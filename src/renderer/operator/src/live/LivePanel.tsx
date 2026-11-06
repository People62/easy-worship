import type { LiveState } from '@shared/live'
import { SlideRenderer } from '../../../shared/SlideRenderer'
import { ChevronLeftIcon, ChevronRightIcon, StopIcon } from '../components/Icons'
import { t } from '@shared/i18n'

function overlayNote(overlay: 'black' | 'clear' | 'logo'): string {
  return {
    black: t('Layar hitam aktif. Tekan F5 atau Esc untuk kembali.'),
    clear: t('Teks disembunyikan. Tekan F6 atau Esc untuk kembali.'),
    logo: t('Logo tampil. Tekan F7 atau Esc untuk kembali.')
  }[overlay]
}

// Exactly what the TVs show, plus every slide of the item on Live so the
// operator can see what comes next and click to jump.
export function LivePanel({ live }: { live: LiveState }): React.JSX.Element {
  const deck = live.deck
  const count = deck?.slides.length ?? 0

  return (
    <div className="deck">
      <div className="deck-head">
        <div className="deck-title">
          <strong title={deck?.title}>{deck?.title || (live.slide ? 'Live' : t('Live kosong'))}</strong>
          <span className="deck-meta">
            {count > 0
              ? `${live.slide?.label ?? ''} · ${live.index + 1}/${count}`
              : t('Tekan Enter untuk mengirim Preview')}
          </span>
        </div>
        <div className="deck-actions">
          <button
            type="button"
            className="btn icon-only"
            disabled={!deck || live.index === 0}
            onClick={() => void window.api.live.step(-1)}
            title={t('Slide sebelumnya (panah kiri, Page Up)')}
          >
            <ChevronLeftIcon />
            <span className="sr-only">{t('Sebelumnya')}</span>
          </button>
          <button
            type="button"
            className="btn icon-only"
            disabled={!deck || live.index >= count - 1}
            onClick={() => void window.api.live.step(1)}
            title={t('Slide berikutnya (panah kanan, Page Down, Spasi)')}
          >
            <ChevronRightIcon />
            <span className="sr-only">{t('Berikutnya')}</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost icon-only"
            disabled={!live.slide}
            onClick={() => void window.api.live.show(null)}
            title={t('Kosongkan Live')}
          >
            <StopIcon />
            <span className="sr-only">{t('Kosongkan Live')}</span>
          </button>
        </div>
      </div>

      <div className="stage">
        <div className="slide-frame">
          <SlideRenderer slide={live.slide} style={live.style} overlay={live.overlay} logoUrl={live.logoUrl} />
        </div>
      </div>

      {live.overlay !== 'none' && (
        <p className="live-note" role="status">
          {overlayNote(live.overlay)}
        </p>
      )}

      {deck && count > 1 && (
        <ol className="slide-grid" aria-label={t('Slide di Live')}>
          {deck.slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                type="button"
                className={index === live.index ? 'slide-thumb is-live' : 'slide-thumb'}
                onClick={() => void window.api.live.goTo(index)}
                title={t('Klik untuk menampilkan slide ini')}
              >
                <span className="thumb-frame">
                  <SlideRenderer slide={slide} style={live.style} overlay="none" logoUrl={null} />
                </span>
                <span className="thumb-label">
                  {index === live.index && <span className="live-dot" aria-label={t('sedang tampil')} />}
                  {slide.label}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
