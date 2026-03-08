/**
 * layerActions.ts
 * Z-index / layer order manipulation for the elements array.
 * Convention: elements[0] = back-most, elements[length-1] = front-most.
 * All functions return a new array (immutable).
 */

import type { SlideElement } from '@/types/elements'

function moveToIndex(arr: SlideElement[], id: string, targetIndex: number): SlideElement[] {
  const src = arr.findIndex(e => e.id === id)
  if (src === -1) return arr
  const copy = [...arr]
  const [el] = copy.splice(src, 1)
  copy.splice(targetIndex, 0, el)
  return copy
}

/** Move element to the very front (last in array). */
export function bringToFront(elements: SlideElement[], id: string): SlideElement[] {
  return moveToIndex(elements, id, elements.length - 1)
}

/** Move element to the very back (first in array). */
export function sendToBack(elements: SlideElement[], id: string): SlideElement[] {
  return moveToIndex(elements, id, 0)
}

/** Move element one step forward (toward the front). */
export function bringForward(elements: SlideElement[], id: string): SlideElement[] {
  const idx = elements.findIndex(e => e.id === id)
  if (idx === -1 || idx === elements.length - 1) return elements
  return moveToIndex(elements, id, idx + 1)
}

/** Move element one step backward (toward the back). */
export function sendBackward(elements: SlideElement[], id: string): SlideElement[] {
  const idx = elements.findIndex(e => e.id === id)
  if (idx === -1 || idx === 0) return elements
  return moveToIndex(elements, id, idx - 1)
}

/**
 * Reorder elements by dragging a layer row.
 * `fromIndex` and `toIndex` are indices in the reversed (top-to-bottom)
 * layers panel list; this fn converts them to the forward array order.
 */
export function reorderLayers(
  elements: SlideElement[],
  panelFromIndex: number,
  panelToIndex: number,
): SlideElement[] {
  const len = elements.length
  const fromIdx = len - 1 - panelFromIndex
  const toIdx   = len - 1 - panelToIndex
  return moveToIndex(elements, elements[fromIdx]?.id, toIdx)
}
