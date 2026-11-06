import { parseScheduleItem, type NewScheduleItem } from '@shared/schedule'

// Drag data between the library, Preview, and the Schedule. A new item
// carries the item itself; a row moved inside the schedule carries its index.
const NEW_ITEM = 'application/x-egw-item'
const ROW = 'application/x-egw-row'

export function dragNewItem(event: React.DragEvent, item: NewScheduleItem): void {
  event.dataTransfer.setData(NEW_ITEM, JSON.stringify(item))
  event.dataTransfer.setData('text/plain', item.title)
  event.dataTransfer.effectAllowed = 'copy'
}

export function dragRow(event: React.DragEvent, index: number): void {
  event.dataTransfer.setData(ROW, String(index))
  event.dataTransfer.effectAllowed = 'move'
}

// While dragging only the types can be read, not the data.
export function isScheduleDrag(event: React.DragEvent): boolean {
  const types = event.dataTransfer.types
  return types.includes(NEW_ITEM) || types.includes(ROW)
}

export type Drop = { kind: 'new'; item: NewScheduleItem } | { kind: 'row'; index: number } | null

export function readDrop(event: React.DragEvent): Drop {
  const row = event.dataTransfer.getData(ROW)
  if (row !== '') {
    const index = Number(row)
    return Number.isInteger(index) ? { kind: 'row', index } : null
  }
  const raw = event.dataTransfer.getData(NEW_ITEM)
  if (!raw) return null
  try {
    const item = parseScheduleItem(JSON.parse(raw))
    return item ? { kind: 'new', item } : null
  } catch {
    return null
  }
}
