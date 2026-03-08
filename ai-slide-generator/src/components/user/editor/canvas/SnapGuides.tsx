'use client'
/**
 * SnapGuides.tsx
 * SVG overlay rendered over the canvas that draws active snap guide lines.
 * Rendered absolutely on top of the canvas, pointer-events disabled.
 */

import React from 'react'
import type { SnapGuide } from '@/lib/editor/snapEngine'

interface SnapGuidesProps {
  guides: SnapGuide[]
  canvasW: number
  canvasH: number
}

export function SnapGuides({ guides, canvasW, canvasH }: SnapGuidesProps) {
  if (guides.length === 0) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 100, overflow: 'visible' }}
      width={canvasW}
      height={canvasH}
    >
      {guides.map((guide, i) => {
        const isVertical = guide.axis === 'x'
        const color = isVertical ? '#3b82f6' : '#ef4444'  // blue for X guides, red for Y
        return isVertical ? (
          <line
            key={i}
            x1={guide.position}
            y1={guide.start}
            x2={guide.position}
            y2={guide.end}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.85}
          />
        ) : (
          <line
            key={i}
            x1={guide.start}
            y1={guide.position}
            x2={guide.end}
            y2={guide.position}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.85}
          />
        )
      })}
    </svg>
  )
}
