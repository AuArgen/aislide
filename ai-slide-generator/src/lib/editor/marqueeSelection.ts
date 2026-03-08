/**
 * marqueeSelection.ts
 * Math for the drag-to-select (marquee) feature.
 * Pure functions — no React dependencies.
 */

import { Rect, XY, rectsIntersect } from './mathUtils'
import type { BaseElement } from '@/types/elements'

// ─── Coordinate helpers ───────────────────────────────────────────────────────

/**
 * Convert client (viewport) coordinates to canvas-local coordinates,
 * accounting for the canvas element's bounding rect and visual scale.
 *
 * @param clientX  Pointer clientX
 * @param clientY  Pointer clientY
 * @param canvasRect  DOMRect from canvasElement.getBoundingClientRect()
 * @param canvasW  Logical canvas width in px (the coordinate system used by elements)
 * @param canvasH  Logical canvas height in px
 */
export function clientToCanvas(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  canvasW: number,
  canvasH: number,
): XY {
  const scaleX = canvasW / canvasRect.width
  const scaleY = canvasH / canvasRect.height
  return {
    x: (clientX - canvasRect.left) * scaleX,
    y: (clientY - canvasRect.top) * scaleY,
  }
}

// ─── Marquee rect normalisation ───────────────────────────────────────────────

/**
 * Normalize two corner points into a Rect with non-negative width/height.
 * This allows the user to drag in any direction.
 */
export function normalizeMarquee(start: XY, end: XY): Rect {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  return {
    x,
    y,
    width:  Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

// ─── Hit-testing ──────────────────────────────────────────────────────────────

/**
 * Return the IDs of all elements (excluding groups and hidden/locked elements if desired)
 * whose bounding box intersects the marquee rect.
 *
 * @param marqueeRect  Canvas-local rect (already normalized).
 * @param elements     All elements on the current slide.
 * @param excludeLocked  If true, locked elements are excluded from selection.
 */
export function getElementsInMarquee(
  marqueeRect: Rect,
  elements: BaseElement[],
  excludeLocked = true,
): string[] {
  if (marqueeRect.width < 2 && marqueeRect.height < 2) return []

  return elements
    .filter(el => {
      if (excludeLocked && el.locked) return false
      if (el.visible === false) return false
      const elRect: Rect = {
        x: el.x,
        y: el.y,
        width:  el.width  ?? 0,
        height: el.height ?? 0,
      }
      return rectsIntersect(marqueeRect, elRect)
    })
    .map(el => el.id)
}
