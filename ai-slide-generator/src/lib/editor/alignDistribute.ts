/**
 * alignDistribute.ts
 * Alignment and distribution utilities for multi-selection.
 * All functions take the full elements array and a set of selectedIds,
 * and return an updated elements array (immutable).
 */

import type { SlideElement } from '@/types/elements'
import { getGroupBBox, toRect, rectCenterX, rectCenterY, rectRight, rectBottom } from './mathUtils'

export type AlignDir = 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom'

// ─── Alignment ────────────────────────────────────────────────────────────────

/**
 * Align all selected elements along the given direction,
 * relative to the group's overall bounding box.
 *
 * @param elements    Full elements array for the current slide.
 * @param selectedIds IDs of the elements to align.
 * @param dir         Which edge/center to align to.
 */
export function alignElements(
  elements: SlideElement[],
  selectedIds: string[],
  dir: AlignDir,
): SlideElement[] {
  if (selectedIds.length < 2) return elements

  const selected = elements.filter(e => selectedIds.includes(e.id))
  const bbox = getGroupBBox(selected.map(toRect))

  return elements.map(el => {
    if (!selectedIds.includes(el.id)) return el
    const r = toRect(el)
    let x = el.x, y = el.y

    switch (dir) {
      case 'left':    x = bbox.x; break
      case 'right':   x = bbox.x + bbox.width - r.width; break
      case 'centerH': x = bbox.x + (bbox.width - r.width) / 2; break
      case 'top':     y = bbox.y; break
      case 'bottom':  y = bbox.y + bbox.height - r.height; break
      case 'centerV': y = bbox.y + (bbox.height - r.height) / 2; break
    }
    return { ...el, x, y }
  })
}

// ─── Distribution ─────────────────────────────────────────────────────────────

/**
 * Evenly distribute 3+ selected elements along an axis.
 * Elements are sorted by position, then the gap between them is equalized.
 * The first and last elements in the sorted order are used as anchors.
 *
 * @param elements    Full elements array.
 * @param selectedIds IDs of elements to distribute (must be ≥ 3).
 * @param axis        'x' = distribute horizontally, 'y' = distribute vertically.
 */
export function distributeElements(
  elements: SlideElement[],
  selectedIds: string[],
  axis: 'x' | 'y',
): SlideElement[] {
  if (selectedIds.length < 3) return elements

  const selected = elements.filter(e => selectedIds.includes(e.id))

  // Sort by leading edge on the relevant axis
  const sorted = [...selected].sort((a, b) =>
    axis === 'x' ? a.x - b.x : a.y - b.y
  )

  const first = sorted[0]
  const last  = sorted[sorted.length - 1]

  if (axis === 'x') {
    // Total span from first-left to last-right
    const totalSpan = rectRight(toRect(last)) - first.x
    const totalWidth = sorted.reduce((sum, el) => sum + (el.width ?? 0), 0)
    const gap = (totalSpan - totalWidth) / (sorted.length - 1)

    let cursor = first.x
    const positions = new Map<string, number>()
    for (const el of sorted) {
      positions.set(el.id, cursor)
      cursor += (el.width ?? 0) + gap
    }

    return elements.map(el => {
      const newX = positions.get(el.id)
      return newX !== undefined ? { ...el, x: newX } : el
    })
  } else {
    const totalSpan = rectBottom(toRect(last)) - first.y
    const totalHeight = sorted.reduce((sum, el) => sum + (el.height ?? 0), 0)
    const gap = (totalSpan - totalHeight) / (sorted.length - 1)

    let cursor = first.y
    const positions = new Map<string, number>()
    for (const el of sorted) {
      positions.set(el.id, cursor)
      cursor += (el.height ?? 0) + gap
    }

    return elements.map(el => {
      const newY = positions.get(el.id)
      return newY !== undefined ? { ...el, y: newY } : el
    })
  }
}
