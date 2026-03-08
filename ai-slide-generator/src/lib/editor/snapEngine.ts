/**
 * snapEngine.ts
 * Computes snap offsets and visual guide lines when dragging elements.
 *
 * Algorithm: for the moving element's 6 snap points (left/center/right/top/center/bottom)
 * check proximity against the same 6 points of every other element plus the canvas center/edges.
 * If within threshold, snap the position and record a guide line.
 */

import {
  Rect,
  rectCenterX,
  rectCenterY,
  rectRight,
  rectBottom,
} from './mathUtils'

export const SNAP_THRESHOLD = 5 // px

export interface SnapGuide {
  axis: 'x' | 'y'
  /** coordinate along the guide's axis (x guides are vertical lines, y guides are horizontal) */
  position: number
  /** start of the rendered line in the perpendicular axis */
  start: number
  /** end of the rendered line in the perpendicular axis */
  end: number
}

export interface SnapResult {
  snapX: number | null  // correction to add to element.x
  snapY: number | null  // correction to add to element.y
  guides: SnapGuide[]
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function xSnapPoints(r: Rect) {
  return [r.x, rectCenterX(r), rectRight(r)]
}
function ySnapPoints(r: Rect) {
  return [r.y, rectCenterY(r), rectBottom(r)]
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Compute snap offsets and guide lines for a moving element.
 *
 * @param moving    The proposed (post-drag) rect of the element being dragged.
 * @param others    Rects of all other elements on the slide (excluding the moving one).
 * @param canvasW   Canvas width in px.
 * @param canvasH   Canvas height in px.
 * @param threshold Snap distance in px (default SNAP_THRESHOLD).
 */
export function computeSnap(
  moving: Rect,
  others: Rect[],
  canvasW: number,
  canvasH: number,
  threshold = SNAP_THRESHOLD,
): SnapResult {
  const guides: SnapGuide[] = []
  let snapX: number | null = null
  let snapY: number | null = null

  // Canvas-edge targets
  const canvasRect: Rect = { x: 0, y: 0, width: canvasW, height: canvasH }
  const targets = [canvasRect, ...others]

  // Current snap points of the moving element
  const mxPoints = xSnapPoints(moving)
  const myPoints = ySnapPoints(moving)

  let bestXDelta = threshold + 1
  let bestYDelta = threshold + 1

  for (const target of targets) {
    const txPoints = xSnapPoints(target)
    const tyPoints = ySnapPoints(target)

    // X-axis snapping (vertical guide lines)
    for (const mx of mxPoints) {
      for (const tx of txPoints) {
        const delta = tx - mx
        if (Math.abs(delta) < threshold && Math.abs(delta) < Math.abs(bestXDelta)) {
          bestXDelta = delta
          snapX = delta

          // Determine the extent of the guide to draw
          const minY = Math.min(moving.y, rectBottom(moving), target.y, rectBottom(target))
          const maxY = Math.max(moving.y, rectBottom(moving), target.y, rectBottom(target))
          guides.push({ axis: 'x', position: tx, start: minY, end: maxY })
        }
      }
    }

    // Y-axis snapping (horizontal guide lines)
    for (const my of myPoints) {
      for (const ty of tyPoints) {
        const delta = ty - my
        if (Math.abs(delta) < threshold && Math.abs(delta) < Math.abs(bestYDelta)) {
          bestYDelta = delta
          snapY = delta

          const minX = Math.min(moving.x, rectRight(moving), target.x, rectRight(target))
          const maxX = Math.max(moving.x, rectRight(moving), target.x, rectRight(target))
          guides.push({ axis: 'y', position: ty, start: minX, end: maxX })
        }
      }
    }
  }

  // Deduplicate guides (same axis+position)
  const seen = new Set<string>()
  const uniqueGuides = guides.filter(g => {
    const key = `${g.axis}:${g.position}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { snapX, snapY, guides: uniqueGuides }
}
