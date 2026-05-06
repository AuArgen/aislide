'use client'

import { EyeOff } from 'lucide-react'
import type { Slide } from '@/types/elements'
import { isText, isShape } from '@/types/elements'
import { useT } from '@/components/shared/LanguageProvider'

function buildSlideStyle(slide: Slide): React.CSSProperties {
  const base: React.CSSProperties = {}
  if (slide.background) {
    if (slide.background.includes('gradient')) base.backgroundImage = slide.background
    else base.backgroundColor = slide.background
  } else {
    base.backgroundColor = '#ffffff'
  }
  if (slide.backgroundImage) {
    base.backgroundImage = `url(${slide.backgroundImage})`
    base.backgroundSize = 'cover'
    base.backgroundPosition = 'center'
  }
  return base
}

interface SlideThumbnailProps {
  slide: Slide
  index: number
  isActive: boolean
  isDragging?: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleHide: () => void
  /** Called when pointer down on the drag handle — caller attaches DnD */
  onDragHandlePointerDown?: (e: React.PointerEvent) => void
}

export function SlideThumbnail({
  slide,
  index,
  isActive,
  isDragging,
  onSelect,
  onDuplicate,
  onDelete,
  onToggleHide,
  onDragHandlePointerDown,
}: SlideThumbnailProps) {
  const t = useT()
  return (
    <div
      className={[
        'group relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all select-none',
        isActive
          ? 'border-blue-500 shadow-md shadow-blue-100'
          : 'border-gray-200 hover:border-blue-300',
        isDragging ? 'opacity-40 scale-95 border-blue-400 shadow-xl' : '',
        slide.isHidden ? 'opacity-50' : '',
      ].join(' ')}
      onClick={onSelect}
    >
      {/* ── Thumbnail canvas (live-ish miniature) ── */}
      <div
        className="aspect-video p-2 flex flex-col overflow-hidden"
        style={buildSlideStyle(slide)}
      >
        {/* Slide title */}
        <div
          className="text-[6px] font-bold truncate leading-tight"
          style={{ color: slide.titleColor || '#1f2937' }}
        >
          {slide.title}
        </div>
        {/* Element stubs */}
        <div className="flex-1 space-y-0.5 mt-1">
          {slide.elements.slice(0, 5).map((el, j) => (
            <div
              key={el.id ?? j}
              className="h-[3px] rounded-full opacity-60"
              style={{
                backgroundColor: isText(el)
                  ? el.color || '#6b7280'
                  : isShape(el)
                    ? el.fill
                    : '#6b7280',
                width: `${Math.min(90, 36 + j * 12)}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Slide number badge ── */}
      <div
        className={`absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded ${
          isActive ? 'bg-blue-500 text-white' : 'bg-black/25 text-white'
        }`}
      >
        {index + 1}
      </div>

      {/* ── Hidden badge ── */}
      {slide.isHidden && (
        <div className="absolute bottom-1 left-1 w-4 h-4 bg-black/40 rounded flex items-center justify-center">
          <EyeOff size={9} className="text-white" />
        </div>
      )}

      {/* ── Drag handle ── */}
      <div
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing w-4 h-4 flex flex-col justify-center items-center gap-[2px]"
        onPointerDown={onDragHandlePointerDown}
      >
        <div className="w-3 h-[2px] bg-gray-400 rounded" />
        <div className="w-3 h-[2px] bg-gray-400 rounded" />
        <div className="w-3 h-[2px] bg-gray-400 rounded" />
      </div>

      {/* ── Action buttons (duplicate / delete / hide) ── */}
      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          title={slide.isHidden ? t('editor.thumbShow') : t('editor.thumbHide')}
          onClick={e => { e.stopPropagation(); onToggleHide() }}
          className="w-5 h-5 bg-white/90 rounded text-gray-500 flex items-center justify-center hover:bg-white shadow-sm text-[9px] font-bold"
        >
          {slide.isHidden ? '👁' : <EyeOff size={9} />}
        </button>
        <button
          title={t('editor.thumbDuplicate')}
          onClick={e => { e.stopPropagation(); onDuplicate() }}
          className="w-5 h-5 bg-white/90 rounded text-gray-600 flex items-center justify-center hover:bg-white shadow-sm"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>
        <button
          title={t('editor.thumbDelete')}
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="w-5 h-5 bg-white/90 rounded text-red-500 flex items-center justify-center hover:bg-white shadow-sm"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
