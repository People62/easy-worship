import {
  clearOverlay,
  INITIAL_LIVE_STATE,
  setLogo,
  showSlide,
  toggleOverlay,
  type LiveState,
  type Overlay,
  type Slide
} from '@shared/live'

type Listener = (state: LiveState) => void

// The one source of truth for what is on the TVs. It lives in the main
// process, so a crash or reload of the operator window never blanks the
// output: the output window keeps showing the last state.
export class LiveStore {
  private state: LiveState = INITIAL_LIVE_STATE
  private readonly listeners = new Set<Listener>()

  get(): LiveState {
    return this.state
  }

  show(slide: Slide | null): LiveState {
    return this.set(showSlide(this.state, slide))
  }

  toggleOverlay(overlay: Exclude<Overlay, 'none'>): LiveState {
    return this.set(toggleOverlay(this.state, overlay))
  }

  clearOverlay(): LiveState {
    return this.set(clearOverlay(this.state))
  }

  setLogo(url: string | null): LiveState {
    return this.state.logoUrl === url ? this.state : this.set(setLogo(this.state, url))
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private set(next: LiveState): LiveState {
    this.state = next
    for (const listener of this.listeners) listener(next)
    return next
  }
}
