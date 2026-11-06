import { SlideRenderer } from '../../shared/SlideRenderer'
import { useLive } from '../../shared/useLive'

// The TV output: nothing but the live slide, full screen.
export function Output(): React.JSX.Element | null {
  const live = useLive()
  if (!live) return null
  return <SlideRenderer slide={live.slide} style={live.style} overlay={live.overlay} logoUrl={live.logoUrl} playVideo />
}
