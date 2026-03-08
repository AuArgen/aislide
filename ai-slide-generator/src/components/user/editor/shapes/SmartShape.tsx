'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ShapeElement } from '@/types/elements'

// ─── SVG Path Builders ────────────────────────────────────────────────────────

function buildShapePath(kind: ShapeElement['shapeKind'], w: number, h: number, borderRadius = 0, arrowHead = 25): string {
  switch (kind) {
    case 'rect':
      // SVG rect as path for uniform handling
      return `M${borderRadius},0 L${w - borderRadius},0 Q${w},0 ${w},${borderRadius} L${w},${h - borderRadius} Q${w},${h} ${w - borderRadius},${h} L${borderRadius},${h} Q0,${h} 0,${h - borderRadius} L0,${borderRadius} Q0,0 ${borderRadius},0 Z`
    case 'circle':
      return `M${w / 2},0 a${w / 2},${h / 2} 0 1,0 0.001,0 Z`
    case 'triangle':
      return `M${w / 2},0 L${w},${h} L0,${h} Z`
    case 'diamond':
      return `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`
    case 'star': {
      const cx = w / 2, cy = h / 2
      const outerR = Math.min(w, h) / 2
      const innerR = outerR * 0.4
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2
        const r = i % 2 === 0 ? outerR : innerR
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
      }
      return `M${pts[0]} L${pts.slice(1).join(' L')} Z`
    }
    case 'hexagon': {
      const cx = w / 2, cy = h / 2
      const rx = w / 2, ry = h / 2
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 6
        return `${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`
      })
      return `M${pts[0]} L${pts.slice(1).join(' L')} Z`
    }
    case 'arrow-right': {
      const bodyH = h * 0.4
      const bodyY = (h - bodyH) / 2
      const headW = Math.min(w * (arrowHead / 100), w * 0.5)
      return [
        `M0,${bodyY}`, `L${w - headW},${bodyY}`,
        `L${w - headW},0`, `L${w},${h / 2}`,
        `L${w - headW},${h}`, `L${w - headW},${bodyY + bodyH}`,
        `L0,${bodyY + bodyH}`, 'Z'
      ].join(' ')
    }
    case 'arrow-left': {
      const bodyH = h * 0.4
      const bodyY = (h - bodyH) / 2
      const headW = Math.min(w * (arrowHead / 100), w * 0.5)
      return [
        `M${headW},0`, `L0,${h / 2}`, `L${headW},${h}`,
        `L${headW},${bodyY + bodyH}`, `L${w},${bodyY + bodyH}`,
        `L${w},${bodyY}`, `L${headW},${bodyY}`, 'Z'
      ].join(' ')
    }
    case 'line':
      return `M0,${h / 2} L${w},${h / 2}`
    case 'cloud': {
      // Simplified cloud using circles
      const cx = w / 2, cy = h / 2
      return `M${cx * 0.2},${h} Q0,${h} 0,${h * 0.7} Q0,${h * 0.5} ${cx * 0.3},${h * 0.45}
        Q${cx * 0.2},${h * 0.15} ${cx * 0.7},${h * 0.2} Q${cx * 0.8},0 ${cx * 1.2},${h * 0.15}
        Q${cx * 1.5},0 ${cx * 1.7},${h * 0.2} Q${w},${h * 0.15} ${w},${h * 0.5}
        Q${w},${h} ${cx * 1.7},${h} Z`
    }
    case 'speech-bubble': {
      const tr = borderRadius || 12
      return [
        `M${tr},0 L${w - tr},0 Q${w},0 ${w},${tr}`,
        `L${w},${h * 0.7 - tr} Q${w},${h * 0.7} ${w - tr},${h * 0.7}`,
        `L${w * 0.55},${h * 0.7} L${w * 0.4},${h} L${w * 0.35},${h * 0.7}`,
        `L${tr},${h * 0.7} Q0,${h * 0.7} 0,${h * 0.7 - tr}`,
        `L0,${tr} Q0,0 ${tr},0 Z`
      ].join(' ')
    }
    default:
      return ''
  }
}

function buildFill(el: ShapeElement): string {
  if (el.fillType === 'gradient') {
    return `linear-gradient(${el.fillGradientAngle ?? 135}deg, ${el.fill}, ${el.fillGradientEnd ?? '#a855f7'})`
  }
  return el.fill
}

function strokeDashArray(style?: string, width = 2): string | undefined {
  if (style === 'dashed') return `${width * 3},${width * 2}`
  if (style === 'dotted') return `${width},${width}`
  return undefined
}

// ─── SmartShape ───────────────────────────────────────────────────────────────

interface SmartShapeProps {
  element: ShapeElement
  onUpdate: (u: Partial<ShapeElement>) => void
}

export function SmartShape({ element, onUpdate }: SmartShapeProps) {
  const [editing, setEditing] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const w = element.width ?? 240
  const h = element.height ?? 160
  const kind = element.shapeKind
  const fill = buildFill(element)
  const stroke = element.stroke
  const strokeW = element.strokeWidth ?? 0
  const strokeStyle = element.strokeStyle ?? 'solid'
  const dashArray = strokeDashArray(strokeStyle, strokeW)
  const isLine = kind === 'line'

  // Auto-resize height when text overflows
  const handleTextInput = useCallback(() => {
    const div = textRef.current
    if (!div) return
    const content = div.innerHTML
    if (div.scrollHeight > (element.height ?? 160)) {
      onUpdate({ text: content, height: div.scrollHeight + 8 })
    } else {
      onUpdate({ text: content })
    }
  }, [element.height, onUpdate])

  // Sync text when not editing
  useEffect(() => {
    if (!editing && textRef.current) {
      textRef.current.innerHTML = element.text ?? ''
    }
  }, [element.text, editing])

  // Focus when editing starts
  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(textRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [editing])

  const pathD = buildShapePath(kind, w, h, element.borderRadius ?? 0, element.arrowHeadSize ?? 25)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
    >
      {/* SVG Shape */}
      <svg
        width={w} height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        aria-hidden
      >
        {element.fillType === 'gradient' && (
          <defs>
            <linearGradient id={`sg-${element.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={element.fill} />
              <stop offset="100%" stopColor={element.fillGradientEnd ?? '#a855f7'} />
            </linearGradient>
          </defs>
        )}
        <path
          d={pathD}
          fill={isLine ? 'none' : element.fillType === 'gradient' ? `url(#sg-${element.id})` : element.fill}
          stroke={stroke || (isLine ? element.fill : 'none')}
          strokeWidth={isLine ? (strokeW || 3) : strokeW}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: element.opacity ?? 1 }}
        />
      </svg>

      {/* Embedded Text */}
      {!isLine && (
        <div
          className="absolute inset-0 flex items-center justify-center p-3 overflow-hidden"
          style={{ pointerEvents: editing ? 'auto' : 'none' }}
        >
          <div
            ref={textRef}
            contentEditable={editing}
            suppressContentEditableWarning
            onInput={handleTextInput}
            onBlur={() => setEditing(false)}
            onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setEditing(false) } }}
            className="w-full outline-none break-words text-center"
            style={{
              fontSize: `${element.textFontSize ?? 20}px`,
              color: element.textColor ?? '#fff',
              fontWeight: element.textBold ? 'bold' : 'normal',
              fontStyle: element.textItalic ? 'italic' : 'normal',
              textAlign: element.textAlign ?? 'center',
              cursor: editing ? 'text' : 'default',
              minHeight: '1.2em',
            }}
            dangerouslySetInnerHTML={!editing ? { __html: element.text ?? '' } : undefined}
          />
        </div>
      )}

      {/* Edit indicator */}
      {editing && (
        <button
          onMouseDown={e => { e.stopPropagation(); setEditing(false) }}
          className="absolute -top-3 -left-3 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center z-50 shadow text-[10px] font-bold"
        >
          ✓
        </button>
      )}
    </div>
  )
}

export { buildShapePath }
