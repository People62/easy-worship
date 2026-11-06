import { useRef } from 'react'

interface SplitterProps {
  // "columns" sits between two columns and drags left/right.
  direction: 'columns' | 'rows'
  label: string
  className?: string
  onStart: () => void
  // Pixels moved since the drag started.
  onMove: (delta: number) => void
  onEnd: () => void
  // Arrow keys move the divider by a step of 16 px (64 px with Shift).
  onStep: (delta: number) => void
}

// A divider between panels. Drag it with the mouse, or focus it with Tab
// and use the arrow keys. Double-click resets the default size.
export function Splitter(props: SplitterProps & { onReset: () => void }): React.JSX.Element {
  const { direction, label, className, onStart, onMove, onEnd, onStep, onReset } = props
  const start = useRef<number | null>(null)
  const coord = (event: React.PointerEvent): number => (direction === 'columns' ? event.clientX : event.clientY)

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={direction === 'columns' ? 'vertical' : 'horizontal'}
      className={`splitter splitter-${direction} ${className ?? ''}`}
      title={`${label}. Seret untuk mengubah ukuran, klik dua kali untuk ukuran awal.`}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        start.current = coord(event)
        onStart()
      }}
      onPointerMove={(event) => {
        if (start.current !== null) onMove(coord(event) - start.current)
      }}
      onPointerUp={() => {
        if (start.current === null) return
        start.current = null
        onEnd()
      }}
      onLostPointerCapture={() => {
        if (start.current === null) return
        start.current = null
        onEnd()
      }}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        const back = direction === 'columns' ? 'ArrowLeft' : 'ArrowUp'
        const forward = direction === 'columns' ? 'ArrowRight' : 'ArrowDown'
        if (event.key !== back && event.key !== forward) return
        // Keep the arrows from also moving slides.
        event.preventDefault()
        event.stopPropagation()
        const step = event.shiftKey ? 64 : 16
        onStep(event.key === forward ? step : -step)
      }}
    />
  )
}
