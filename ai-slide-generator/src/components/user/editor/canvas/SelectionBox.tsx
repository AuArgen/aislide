'use client'
/**
 * SelectionBox.tsx
 * Renders the selection bounding box around one or more selected elements,
 * with 8 resize handles and a rotation handle.
 *
 * Features:
 *  - 8 directional resize handles (N, S, E, W, NE, NW, SE, SW)
 *  - Rotation handle above the top-center, connected by a thin line
 *  - Shift+drag → aspect-ratio lock (via transformUtils)
 *  - Alt/Option+drag → scale from center
 *  - Shift+rotation → snap to 15° increments
 */

import React, { useRef } from 'react'
import { applyResize, axisLock } from '@/lib/editor/transformUtils'
import { snapAngleIfClose } from '@/lib/editor/mathUtils'
import type { ResizeHandle, ResizeOptions } from '@/lib/editor/transformUtils'
import type { Rect } from '@/lib/editor/mathUtils'
import { useCanvasScale } from './canvasScaleContext'
import { useSlidesStore } from '@/store/slidesStore'

interface SelectionBoxProps {
  /** Bounding box in canvas-local px */
  rect: Rect
  /** Current rotation in degrees */
  rotation?: number
  /** Called when user resizes — provide the new bounding rect */
  onResize: (newRect: Rect) => void
  /** Called when user rotates — provide the new angle in degrees */
  onRotate: (angle: number) => void
  /** Whether the element is an image (always lock aspect) */
  isImage?: boolean
}

// ─── Handle descriptors ───────────────────────────────────────────────────────

interface HandleDesc {
  id: ResizeHandle
  /** Positional style (percent-based for the handle dot) */
  style: React.CSSProperties
  cursor: string
}

const HANDLES: HandleDesc[] = [
  { id: 'nw', style: { top: -5, left: -5 }, cursor: 'nwse-resize' },
  { id: 'n', style: { top: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { id: 'ne', style: { top: -5, right: -5 }, cursor: 'nesw-resize' },
  { id: 'e', style: { top: '50%', right: -5, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  { id: 'se', style: { bottom: -5, right: -5 }, cursor: 'nwse-resize' },
  { id: 's', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { id: 'sw', style: { bottom: -5, left: -5 }, cursor: 'nesw-resize' },
  { id: 'w', style: { top: '50%', left: -5, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
]

const HANDLE_SIZE = 10

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectionBox({
  rect,
  rotation = 0,
  onResize,
  onRotate,
  isImage = false,
}: SelectionBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const axisLockDominant = useRef<'x' | 'y' | null>(null)
  // Dividing screen-pixel deltas by the canvas CSS scale converts them into
  // 1920×1080 canvas coordinates so handles move at the correct speed.
  const canvasScale = useCanvasScale()

  // ── Resize pointer handling ─────────────────────────────────────────────────
  const handleResizePointerDown = (
    e: React.PointerEvent,
    handle: ResizeHandle,
  ) => {
    e.stopPropagation()
    e.preventDefault()

    useSlidesStore.getState().saveHistorySnapshot()

    const startX = e.clientX
    const startY = e.clientY
    const original = { ...rect }
    axisLockDominant.current = null

    const onMove = (ev: PointerEvent) => {
      const shiftHeld = ev.shiftKey
      const altHeld = ev.altKey

      // Convert from screen px → canvas px by dividing by the CSS scale factor.
      const dx = (ev.clientX - startX) / canvasScale
      const dy = (ev.clientY - startY) / canvasScale

      const opts: ResizeOptions = {
        lockAspect: isImage || shiftHeld,
        fromCenter: altHeld,
        minWidth: 20,
        minHeight: 20,
      }

      const newRect = applyResize(handle, { x: dx, y: dy }, original, opts)
      onResize(newRect)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ── Rotation pointer handling ───────────────────────────────────────────────
  const handleRotatePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()

    useSlidesStore.getState().saveHistorySnapshot()

    if (!boxRef.current) return
    const boxEl = boxRef.current
    const boxRect = boxEl.getBoundingClientRect()
    const cx = boxRect.left + boxRect.width / 2
    const cy = boxRect.top + boxRect.height / 2

    const onMove = (ev: PointerEvent) => {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90
      const normalized = ((angle % 360) + 360) % 360
      const final = ev.shiftKey ? snapAngleIfClose(normalized, 15, 8) : normalized
      onRotate(final)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const ROTATION_HANDLE_OFFSET = 28 // px above the box

  return (
    <div
      ref={boxRef}
      className="absolute pointer-events-none"
      style={{
        left: rect.x - 1,
        top: rect.y - 1,
        width: rect.width + 2,
        height: rect.height + 2,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
        zIndex: 200,
        border: '1.5px solid #3b82f6',
        borderRadius: 2,
      }}
    >
      {/* ── Rotation handle stem ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: -ROTATION_HANDLE_OFFSET,
          width: 1,
          height: ROTATION_HANDLE_OFFSET,
          background: '#3b82f6',
          transform: 'translateX(-50%)',
          opacity: 0.6,
        }}
      />

      {/* ── Rotation handle circle ── */}
      <div
        className="absolute pointer-events-auto"
        onPointerDown={handleRotatePointerDown}
        style={{
          left: '50%',
          top: -(ROTATION_HANDLE_OFFSET + HANDLE_SIZE),
          transform: 'translateX(-50%)',
          width: HANDLE_SIZE + 2,
          height: HANDLE_SIZE + 2,
          borderRadius: '50%',
          background: '#ffffff',
          border: '2px solid #3b82f6',
          cursor: 'crosshair',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />

      {/* ── Resize handles ── */}
      {HANDLES.map(h => (
        <div
          key={h.id}
          className="absolute pointer-events-auto"
          style={{
            ...h.style,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            borderRadius: 2,
            background: '#ffffff',
            border: '2px solid #3b82f6',
            cursor: h.cursor,
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }}
          onPointerDown={e => handleResizePointerDown(e, h.id)}
        />
      ))}
    </div>
  )
}
