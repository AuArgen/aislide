'use client'
/**
 * MarqueeBox.tsx
 * The semi-transparent selection rectangle rendered while the user
 * drags across the canvas background (marquee/lasso selection).
 * Takes canvas-local coordinates and renders absolutely within the canvas.
 */

import React from 'react'
import { normalizeMarquee } from '@/lib/editor/marqueeSelection'
import type { XY } from '@/lib/editor/mathUtils'

interface MarqueeBoxProps {
  start: XY
  end: XY
}

export function MarqueeBox({ start, end }: MarqueeBoxProps) {
  const rect = normalizeMarquee(start, end)
  if (rect.width < 2 && rect.height < 2) return null

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left:   rect.x,
        top:    rect.y,
        width:  rect.width,
        height: rect.height,
        border: '1.5px dashed #3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        zIndex: 90,
        borderRadius: 2,
      }}
    />
  )
}
