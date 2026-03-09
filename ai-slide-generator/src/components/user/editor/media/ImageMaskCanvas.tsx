'use client'

import { useRef, useState, useId, useCallback } from 'react'
import type { ImageElement, MaskShape } from '@/types/elements'
import { buildCssFilter } from './ImageEditor'

// ── SVG mask shape path definitions ──────────────────────────────────────────
// All shapes defined in a 100×100 viewBox for easy scaling

function getMaskPath(shape: MaskShape): string {
  switch (shape) {
    case 'circle':
      return 'M50,5 a45,45 0 1,0 0.001,0 Z'
    case 'star':
      return 'M50,5 L61,35 L95,35 L68,57 L79,91 L50,70 L21,91 L32,57 L5,35 L39,35 Z'
    case 'hexagon':
      // regular hexagon flat-top
      return 'M25,7 L75,7 L97,47 L75,90 L25,90 L3,47 Z'
    case 'diamond':
      return 'M50,5 L95,50 L50,95 L5,50 Z'
    case 'device-iphone':
      // Simplified phone outline
      return [
        'M30,2 Q70,2 70,2 Q98,2 98,20',
        'L98,80 Q98,98 70,98 L30,98 Q2,98 2,80',
        'L2,20 Q2,2 30,2 Z',
        'M40,7 L60,7 Q62,7 62,10 L62,12 Q62,14 60,14 L40,14 Q38,14 38,12 L38,10 Q38,7 40,7 Z',
        'M50,88 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0 Z',
      ].join(' ')
    case 'device-browser':
      return [
        'M2,8 Q2,2 8,2 L92,2 Q98,2 98,8 L98,92 Q98,98 92,98 L8,98 Q2,98 2,92 Z',
        'M2,18 L98,18',
        'M10,10 a3,3 0 1,0 0.001,0 Z',
        'M22,10 a3,3 0 1,0 0.001,0 Z',
        'M34,10 a3,3 0 1,0 0.001,0 Z',
        'M42,6 L90,6 Q94,6 94,10 L94,14 Q94,16 90,16 L42,16 Q38,16 38,14 L38,10 Q38,6 42,6 Z',
      ].join(' ')
    default:
      return ''
  }
}

const MASK_OPTIONS: { value: MaskShape; label: string; emoji: string }[] = [
  { value: 'none', label: 'Жок', emoji: '⬜' },
  { value: 'circle', label: 'Тегерек', emoji: '⭕' },
  { value: 'star', label: 'Жылдыз', emoji: '⭐' },
  { value: 'hexagon', label: 'Алтыбурч', emoji: '⬡' },
  { value: 'diamond', label: 'Ромб', emoji: '💎' },
  { value: 'device-iphone', label: 'Телефон', emoji: '📱' },
  { value: 'device-browser', label: 'Браузер', emoji: '🖥️' },
]

interface ImageMaskCanvasProps {
  element: ImageElement
  isSelected: boolean
  onUpdate: (updates: Partial<ImageElement>) => void
}

export function ImageMaskCanvas({ element, isSelected, onUpdate }: ImageMaskCanvasProps) {
  const maskId = useId().replace(/:/g, '_')
  const [repositionMode, setRepositionMode] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; imgX: number; imgY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const w = element.width ?? 300
  const h = element.height ?? 200
  const imgX = element.maskImageX ?? 0
  const imgY = element.maskImageY ?? 0
  const imgScale = element.maskImageScale ?? 1
  const maskShape = element.maskShape ?? 'none'
  const [imgError, setImgError] = useState(false)
  const cssFilter = buildCssFilter(element.filters)

  // ── Drag-to-reposition image inside mask ──────────────────────────────────
  const startReposition = useCallback((e: React.PointerEvent) => {
    if (!repositionMode) return
    e.stopPropagation(); e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, imgX, imgY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [repositionMode, imgX, imgY])

  const onReposition = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    onUpdate({ maskImageX: dragRef.current.imgX + dx, maskImageY: dragRef.current.imgY + dy })
  }, [onUpdate])

  const endReposition = useCallback(() => { dragRef.current = null }, [])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRepositionMode(r => !r)
  }

  if (maskShape === 'none') {
    return (
      <div ref={containerRef} className="w-full h-full overflow-hidden relative"
        style={{ borderRadius: element.borderRadius ?? 0, backgroundColor: imgError || !element.src ? '#e5e7eb' : 'transparent' }}
        onDoubleClick={handleDoubleClick}
      >
        {(!element.src || imgError) ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            <span className="text-[10px] font-medium uppercase tracking-wider">Сүрөт жок</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={element.src}
            alt={element.alt ?? ''}
            draggable={false}
            onError={() => setImgError(true)}
            onLoad={() => setImgError(false)}
            className="w-full h-full"
            style={{ objectFit: element.objectFit ?? 'cover', filter: cssFilter, opacity: element.opacity ?? 1 }}
          />
        )}
      </div>
    )
  }

  // ── Render: masked image via SVG clipPath ──────────────────────────────────
  const svgViewBox = '0 0 100 100'
  const maskPath = getMaskPath(maskShape)
  // We scale the image to fill/cover the mask shape
  const imgW = w * imgScale
  const imgH = h * imgScale
  const imgOffX = (w - imgW) / 2 + imgX
  const imgOffY = (h - imgH) / 2 + imgY

  return (
    <div ref={containerRef} className="w-full h-full relative select-none" onDoubleClick={handleDoubleClick}>
      <svg
        width={w} height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', overflowVisible: 'visible' } as React.CSSProperties}
        onPointerDown={startReposition}
        onPointerMove={onReposition}
        onPointerUp={endReposition}
      >
        <defs>
          {/* Scale the 100×100 path to fill the element dimensions */}
          <clipPath id={`mask-${maskId}`} clipPathUnits="userSpaceOnUse">
            <g transform={`scale(${w / 100} ${h / 100})`}>
              <path d={maskPath} />
            </g>
          </clipPath>
        </defs>

        {/* Clipped image or placeholder */}
        {(!element.src || imgError) ? (
          <g clipPath={`url(#mask-${maskId})`}>
            <rect x="0" y="0" width={w} height={h} fill="#e5e7eb" />
            {/* Simple broken image icon scaled in centre */}
            <g transform={`translate(${w / 2 - 12} ${h / 2 - 12})`}>
              <path fill="none" stroke="#9ca3af" strokeWidth="2" d="M3 3h18v18H3zM9 9a2 2 0 100-4 2 2 0 000 4zm12 6l-3.086-3.086a2 2 0 00-2.828 0L6 21" />
            </g>
          </g>
        ) : (
          <image
            href={element.src}
            x={imgOffX} y={imgOffY}
            width={imgW} height={imgH}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#mask-${maskId})`}
            onError={() => setImgError(true)}
            onLoad={() => setImgError(false)}
            style={{ filter: cssFilter, opacity: element.opacity ?? 1 }}
          />
        )}

        {/* Shape stroke (optional) */}
        <g transform={`scale(${w / 100} ${h / 100})`}>
          <path
            d={maskPath}
            fill="none"
            stroke={isSelected ? 'rgba(59,130,246,0.6)' : 'none'}
            strokeWidth={isSelected ? 0.5 : 0}
          />
        </g>
      </svg>

      {/* Reposition mode indicator */}
      {repositionMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-500/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
            ↕ Жылдыруу режими — 2× басып чыгыңыз
          </div>
        </div>
      )}
      {repositionMode && (
        <div className="absolute inset-0 cursor-move"
          style={{ cursor: 'move' }}
          onPointerDown={startReposition}
          onPointerMove={onReposition}
          onPointerUp={endReposition}
        />
      )}
    </div>
  )
}

// ── Mask Selector (right panel widget) ───────────────────────────────────────
interface MaskSelectorProps {
  current: MaskShape
  onChange: (shape: MaskShape) => void
  layout?: 'toolbar' | 'panel'
}

export function MaskSelector({ current, onChange, layout = 'panel' }: MaskSelectorProps) {
  if (layout === 'toolbar') {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden md:inline">Маска</span>
        {MASK_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={`flex items-center justify-center w-7 h-7 rounded transition-colors
              ${current === opt.value ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <span>{opt.emoji}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Маска / Форма</p>
      <div className="grid grid-cols-2 gap-1">
        {MASK_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors
              ${current === opt.value ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <span>{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Scale slider (only when mask active) */}
      {current !== 'none' && (
        <div className="mt-2">
          <p className="text-[10px] text-gray-400 mb-1">Масштаб</p>
          <input type="range" min={50} max={200} defaultValue={100}
            onChange={e => (document as any)._maskScaleCallback?.(Number(e.target.value) / 100)}
            className="w-full h-1.5 appearance-none rounded-full accent-blue-500" />
        </div>
      )}
    </div>
  )
}
