import type { Slide, SlideStyle } from './live'
import { sectionLabel, type Song, type SongSection } from './songs'

export const MIN_LINES_PER_SLIDE = 1
export const MAX_LINES_PER_SLIDE = 12
export const DEFAULT_LINES_PER_SLIDE = 4

// Splits lines into chunks of at most maxLines, spread evenly so the last
// slide is never left with a single orphan line: 5 lines at max 4 become
// 3 + 2, not 4 + 1.
export function chunkLines(lines: string[], maxLines: number): string[][] {
  const max = Math.max(MIN_LINES_PER_SLIDE, Math.floor(maxLines))
  if (lines.length <= max) return lines.length > 0 ? [lines] : []
  const count = Math.ceil(lines.length / max)
  const base = Math.floor(lines.length / count)
  const extra = lines.length % count
  const chunks: string[][] = []
  let start = 0
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0)
    chunks.push(lines.slice(start, start + size))
    start += size
  }
  return chunks
}

// One section becomes one or more slides. A blank line in the lyrics forces
// a new slide; long parts are split by maxLines.
export function sectionSlideTexts(section: Pick<SongSection, 'text'>, maxLines: number): string[] {
  return section.text
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').filter((line) => line.trim() !== ''))
    .flatMap((lines) => chunkLines(lines, maxLines))
    .map((lines) => lines.join('\n'))
}

export function buildSongSlides(song: Pick<Song, 'id' | 'sections'>, maxLines: number, style?: SlideStyle): Slide[] {
  return song.sections.flatMap((section, sectionIndex) => {
    const texts = sectionSlideTexts(section, maxLines)
    const label = sectionLabel(section)
    return texts.map((text, part) => ({
      id: `song:${song.id}:${sectionIndex}:${part}`,
      text,
      label: texts.length > 1 ? `${label} (${part + 1}/${texts.length})` : label,
      ...(style ? { style } : {})
    }))
  })
}
