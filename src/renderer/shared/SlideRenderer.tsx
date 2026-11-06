import { useLayoutEffect, useRef, useState } from 'react'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  fitScale,
  slideLines,
  type Background,
  type LiveState,
  type SlideStyle
} from '@shared/live'
import { EgEmblem } from './EgEmblem'
import './slide.css'

type SlideRendererProps = Pick<LiveState, 'slide' | 'style' | 'overlay' | 'logoUrl'> & {
  // Only the TV output plays video backgrounds. Preview, Live, and thumbnails
  // show a still frame, so the 4 GB church laptop decodes one video, not five.
  playVideo?: boolean
}

function useFitScale<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setScale(fitScale(width, height))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, scale]
}

function textShadow(style: SlideStyle): string {
  return style.shadow ? '0 4px 12px rgb(0 0 0 / 85%), 0 0 2px rgb(0 0 0 / 90%)' : 'none'
}

function BackgroundLayer({ background, playVideo }: { background: Background; playVideo: boolean }): React.JSX.Element {
  if (background.kind === 'color') return <div className="slide-bg" style={{ background: background.color }} />
  if (background.kind === 'image') {
    return <img className="slide-bg" src={background.url} alt="" draggable={false} />
  }
  if (playVideo) {
    // The key keeps the same <video> element across slides that share this
    // background, so the video keeps playing instead of restarting.
    return (
      <video
        key={background.url}
        className="slide-bg"
        src={background.url}
        poster={background.posterUrl ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
      />
    )
  }
  return background.posterUrl ? (
    <img className="slide-bg" src={background.posterUrl} alt="" draggable={false} />
  ) : (
    <div className="slide-bg" style={{ background: '#1c1917' }} />
  )
}

// Draws one slide on a 1920×1080 canvas and scales it to fit its box. The
// same component renders the thumbnails, Preview, Live, and the TV output,
// so what the operator sees in Live is exactly what the congregation sees.
export function SlideRenderer(props: SlideRendererProps): React.JSX.Element {
  const { slide, overlay, logoUrl, playVideo = false } = props
  const [boxRef, scale] = useFitScale<HTMLDivElement>()
  const style = slide?.style ?? props.style
  const lines = slide ? slideLines(slide.text, style.uppercase) : []
  const hasMedia = style.background.kind !== 'color'
  const showBackground = overlay === 'none' || overlay === 'clear'
  const insetY = Math.round(style.margin * 0.66)

  return (
    <div ref={boxRef} className="slide-box">
      <div
        className="slide-canvas"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`
        }}
      >
        {showBackground && <BackgroundLayer background={style.background} playVideo={playVideo} />}
        {showBackground && hasMedia && style.backgroundDim > 0 && (
          <div className="slide-bg" style={{ background: `rgb(0 0 0 / ${style.backgroundDim})` }} />
        )}

        {overlay === 'logo' && (
          <div className="slide-logo">{logoUrl ? <img src={logoUrl} alt="" draggable={false} /> : <EgEmblem />}</div>
        )}

        {overlay === 'none' && lines.length > 0 && (
          <div
            className="slide-text"
            style={{
              top: insetY,
              bottom: slide?.caption ? insetY + 110 : insetY,
              left: style.margin,
              right: style.margin,
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
              color: style.color,
              textAlign: style.align,
              textShadow: textShadow(style),
              WebkitTextStroke: style.outlineWidth > 0 ? `${style.outlineWidth}px ${style.outlineColor}` : undefined,
              paintOrder: 'stroke fill'
            }}
          >
            {lines.map((line, index) => (
              <div key={index} className="slide-line">
                {line || ' '}
              </div>
            ))}
          </div>
        )}

        {overlay === 'none' && slide?.caption && (
          <div
            className="slide-caption"
            style={{
              left: style.margin,
              right: style.margin,
              fontFamily: style.fontFamily,
              color: style.color,
              textAlign: style.align,
              textShadow: textShadow(style)
            }}
          >
            {slide.caption}
          </div>
        )}
      </div>
    </div>
  )
}
