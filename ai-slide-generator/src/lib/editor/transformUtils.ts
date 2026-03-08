/**
 * transformUtils.ts
 * Resize and drag transform calculations.
 * Handles proportional resize, center-origin scaling, and axis-lock dragging.
 */

import { Rect, XY } from './mathUtils'

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface ResizeOptions {
  /** Lock the aspect ratio (e.g. for images or when Shift is held) */
  lockAspect?: boolean
  /** Scale from center instead of opposite corner (Alt/Option held) */
  fromCenter?: boolean
  /** Minimum allowed width */
  minWidth?: number
  /** Minimum allowed height */
  minHeight?: number
}

// ─── Resize ───────────────────────────────────────────────────────────────────

/**
 * Given a resize handle, a drag delta, and the original rect,
 * compute the new rect (x, y, width, height).
 */
export function applyResize(
  handle: ResizeHandle,
  delta: XY,
  original: Rect,
  opts: ResizeOptions = {},
): Rect {
  const { lockAspect = false, fromCenter = false, minWidth = 20, minHeight = 20 } = opts
  const aspectRatio = original.width / original.height

  let { x, y, width, height } = original
  const { x: dx, y: dy } = delta

  switch (handle) {
    case 'e':  width  = Math.max(minWidth,  original.width  + dx); break
    case 'w':  width  = Math.max(minWidth,  original.width  - dx); x = original.x + original.width - width; break
    case 's':  height = Math.max(minHeight, original.height + dy); break
    case 'n':  height = Math.max(minHeight, original.height - dy); y = original.y + original.height - height; break
    case 'se': width  = Math.max(minWidth,  original.width  + dx); height = Math.max(minHeight, original.height + dy); break
    case 'sw': width  = Math.max(minWidth,  original.width  - dx); x = original.x + original.width - width; height = Math.max(minHeight, original.height + dy); break
    case 'ne': width  = Math.max(minWidth,  original.width  + dx); height = Math.max(minHeight, original.height - dy); y = original.y + original.height - height; break
    case 'nw': width  = Math.max(minWidth,  original.width  - dx); x = original.x + original.width - width; height = Math.max(minHeight, original.height - dy); y = original.y + original.height - height; break
  }

  // Aspect-ratio lock
  if (lockAspect) {
    const isHorizontalHandle = handle === 'e' || handle === 'w'
    const isVerticalHandle   = handle === 's' || handle === 'n'
    if (isHorizontalHandle) {
      height = width / aspectRatio
    } else if (isVerticalHandle) {
      width = height * aspectRatio
    } else {
      // Corner handle — use whichever dimension changed more
      if (Math.abs(dx) > Math.abs(dy)) {
        height = width / aspectRatio
      } else {
        width = height * aspectRatio
      }
      // Re-position for nw corner after aspect correction
      if (handle === 'nw') { x = original.x + original.width - width; y = original.y + original.height - height }
      if (handle === 'ne') { y = original.y + original.height - height }
      if (handle === 'sw') { x = original.x + original.width - width }
    }
    width  = Math.max(minWidth,  width)
    height = Math.max(minHeight, height)
  }

  // Scale from center (Alt/Option held)
  if (fromCenter) {
    const cx = original.x + original.width  / 2
    const cy = original.y + original.height / 2
    x = cx - width  / 2
    y = cy - height / 2
  }

  return { x, y, width, height }
}

// ─── Axis-lock drag ───────────────────────────────────────────────────────────

export type AxisLockDominant = 'x' | 'y' | null

/**
 * When Shift is held during drag, determine which axis to lock based on the
 * initial direction the user moved, and then zero out the other axis.
 *
 * @param delta      Raw pointer delta from drag start.
 * @param dominant   Already-determined dominant axis (null = not yet decided).
 * @param threshold  Minimum movement to determine dominant axis (default 4px).
 * @returns  { dominant, result } — the resolved axis and the corrected delta.
 */
export function axisLock(
  delta: XY,
  dominant: AxisLockDominant,
  threshold = 4,
): { dominant: AxisLockDominant; result: XY } {
  if (!dominant) {
    // Not yet determined — pick the larger axis once beyond threshold
    if (Math.abs(delta.x) > threshold || Math.abs(delta.y) > threshold) {
      dominant = Math.abs(delta.x) >= Math.abs(delta.y) ? 'x' : 'y'
    }
  }
  if (!dominant) return { dominant: null, result: delta }
  return {
    dominant,
    result: dominant === 'x' ? { x: delta.x, y: 0 } : { x: 0, y: delta.y },
  }
}
