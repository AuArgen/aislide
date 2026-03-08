/**
 * mathUtils.ts
 * Pure math utilities for the editor engine — no React/DOM dependencies.
 */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface XY {
  x: number
  y: number
}

// ─── Bounding Box ────────────────────────────────────────────────────────────

/**
 * Compute the axis-aligned bounding box that contains all given rects.
 * Returns a zero-size rect at origin if the array is empty.
 */
export function getGroupBBox(rects: Rect[]): Rect {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const r of rects) {
    if (r.x < minX) minX = r.x
    if (r.y < minY) minY = r.y
    if (r.x + r.width > maxX) maxX = r.x + r.width
    if (r.y + r.height > maxY) maxY = r.y + r.height
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * Extract a Rect from any object with x, y, width, height fields.
 * Falls back to 0 for missing width/height.
 */
export function toRect(el: { x: number; y: number; width?: number; height?: number }): Rect {
  return { x: el.x, y: el.y, width: el.width ?? 0, height: el.height ?? 0 }
}

// ─── Intersection ────────────────────────────────────────────────────────────

/**
 * Returns true if two axis-aligned rects overlap (touching edges count as intersecting).
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  )
}

/**
 * Returns true if rect `inner` is fully contained within `outer`.
 */
export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

// ─── Rotation ────────────────────────────────────────────────────────────────

/**
 * Snap an angle (in degrees) to the nearest multiple of `step`.
 * E.g. snapAngle(47, 15) => 45
 */
export function snapAngle(angle: number, step: number): number {
  return Math.round(angle / step) * step
}

/**
 * Snap angle only if it's within `tolerance` degrees of a snap point.
 */
export function snapAngleIfClose(angle: number, step: number, tolerance: number = 5): number {
  const snapped = snapAngle(angle, step)
  return Math.abs(angle - snapped) <= tolerance ? snapped : angle
}

/**
 * Rotate point (px, py) around center (cx, cy) by `deg` degrees.
 */
export function rotatePoint(px: number, py: number, cx: number, cy: number, deg: number): XY {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = px - cx
  const dy = py - cy
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  }
}

// ─── Scalar helpers ──────────────────────────────────────────────────────────

/** Clamp `val` between `min` and `max`. */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/** Linear interpolate from a to b by t (0–1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Euclidean distance between two points. */
export function distance(a: XY, b: XY): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

// ─── Rect center helpers ─────────────────────────────────────────────────────

export function rectCenterX(r: Rect): number { return r.x + r.width / 2 }
export function rectCenterY(r: Rect): number { return r.y + r.height / 2 }
export function rectRight(r: Rect): number   { return r.x + r.width }
export function rectBottom(r: Rect): number  { return r.y + r.height }
