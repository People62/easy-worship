import { useLayoutEffect, useRef, useState } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH, fitScale, slideLines, type LiveState } from '@shared/live'
import { EgEmblem } from './EgEmblem'
import './slide.css'

type SlideRendererProps = Pick<LiveState, 'slide' | 'style' | 'overlay' | 'logoUrl'>

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

// Draws one slide on a 1920×1080 canvas and scales it to fit its box. The
// same component renders the thumbnails, Preview, Live, and the TV output,
// so what the operator sees in Live is exactly what the congregation sees.
export function SlideRenderer({ slide, style, overlay, logoUrl }: SlideRendererProps): React.JSX.Element {
  const [boxRef, scale] = useFitScale<HTMLDivElement>()
  const background = slide?.background ?? style.background
  const lines = slide ? slideLines(slide.text, style.uppercase) : []

  return (
    <div ref={boxRef} className="slide-box">
      <div
        className="slide-canvas"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
          background: overlay === 'black' || overlay === 'logo' ? '#000' : background.color
        }}
      >
        {overlay === 'logo' && (
          <div className="slide-logo">{logoUrl ? <img src={logoUrl} alt="" draggable={false} /> : <EgEmblem />}</div>
        )}
        {overlay === 'none' && lines.length > 0 && (
          <div
            className="slide-text"
            style={{
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
              color: style.color,
              textAlign: style.align,
              textShadow: style.shadow ? '0 4px 12px rgb(0 0 0 / 85%), 0 0 2px rgb(0 0 0 / 90%)' : 'none'
            }}
          >
            {lines.map((line, index) => (
              <div key={index} className="slide-line">
                {line || ' '}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
