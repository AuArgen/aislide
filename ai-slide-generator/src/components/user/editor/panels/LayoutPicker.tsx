/**
 * LayoutPicker.tsx
 * Visual slide-layout picker component.
 * Renders a grid of thumbnail previews; clicking a layout inserts a new slide.
 */
'use client'

import { useSlidesStore } from '@/store/slidesStore'
import { useEditorStore } from '@/store/editorStore'
import type { SlideLayoutType } from '@/types/elements'

// ─── Layout registry ──────────────────────────────────────────────────────────

interface LayoutDef {
  id: SlideLayoutType
  label: string
  preview: React.ReactNode  // SVG micro-preview
}

function ThumbnailBlank() {
  return (
    <svg viewBox="0 0 80 45" className="w-full h-full">
      <rect width="80" height="45" rx="3" fill="#f8fafc" />
    </svg>
  )
}

function ThumbnailTitle() {
  return (
    <svg viewBox="0 0 80 45" className="w-full h-full">
      <rect width="80" height="45" rx="3" fill="#f8fafc" />
      <rect x="10" y="14" width="60" height="7" rx="2" fill="#6366f1" opacity="0.8" />
      <rect x="20" y="25" width="40" height="4" rx="1.5" fill="#94a3b8" opacity="0.6" />
    </svg>
  )
}

function ThumbnailTitleBody() {
  return (
    <svg viewBox="0 0 80 45" className="w-full h-full">
      <rect width="80" height="45" rx="3" fill="#f8fafc" />
      <rect x="6" y="7" width="68" height="7" rx="2" fill="#6366f1" opacity="0.8" />
      <rect x="6" y="18" width="68" height="3.5" rx="1.5" fill="#94a3b8" opacity="0.5" />
      <rect x="6" y="24" width="55" height="3.5" rx="1.5" fill="#94a3b8" opacity="0.5" />
      <rect x="6" y="30" width="62" height="3.5" rx="1.5" fill="#94a3b8" opacity="0.5" />
    </svg>
  )
}

function ThumbnailTwoCol() {
  return (
    <svg viewBox="0 0 80 45" className="w-full h-full">
      <rect width="80" height="45" rx="3" fill="#f8fafc" />
      {/* Left col */}
      <rect x="6" y="7" width="31" height="5" rx="1.5" fill="#6366f1" opacity="0.7" />
      <rect x="6" y="15" width="31" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
      <rect x="6" y="21" width="26" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
      <rect x="6" y="27" width="29" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
      {/* Divider */}
      <line x1="43" y1="7" x2="43" y2="38" stroke="#e2e8f0" strokeWidth="0.8" />
      {/* Right col */}
      <rect x="47" y="7" width="27" height="5" rx="1.5" fill="#6366f1" opacity="0.7" />
      <rect x="47" y="15" width="27" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
      <rect x="47" y="21" width="22" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
      <rect x="47" y="27" width="25" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
    </svg>
  )
}

function ThumbnailImageText() {
  return (
    <svg viewBox="0 0 80 45" className="w-full h-full">
      <rect width="80" height="45" rx="3" fill="#f8fafc" />
      {/* Image placeholder */}
      <rect x="5" y="6" width="34" height="33" rx="2" fill="#e2e8f0" />
      <text x="22" y="24" textAnchor="middle" fontSize="8" fill="#94a3b8">🖼</text>
      {/* Text */}
      <rect x="44" y="8" width="31" height="5.5" rx="1.5" fill="#6366f1" opacity="0.8" />
      <rect x="44" y="17" width="31" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
      <rect x="44" y="23" width="26" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
      <rect x="44" y="29" width="29" height="3" rx="1" fill="#94a3b8" opacity="0.5" />
    </svg>
  )
}

function ThumbnailSectionHeader() {
  return (
    <svg viewBox="0 0 80 45" className="w-full h-full">
      <defs>
        <linearGradient id="lp-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      <rect width="80" height="45" rx="3" fill="url(#lp-grad)" />
      <rect x="10" y="14" width="60" height="8" rx="2" fill="white" opacity="0.9" />
      <rect x="18" y="26" width="44" height="4" rx="1.5" fill="white" opacity="0.5" />
    </svg>
  )
}

const LAYOUTS: LayoutDef[] = [
  { id: 'blank',          label: 'Бош',          preview: <ThumbnailBlank /> },
  { id: 'title',          label: 'Аталыш',        preview: <ThumbnailTitle /> },
  { id: 'title-body',     label: 'Аталыш + Текст', preview: <ThumbnailTitleBody /> },
  { id: 'two-column',     label: 'Эки мамыча',   preview: <ThumbnailTwoCol /> },
  { id: 'image-text',     label: 'Сурот + Текст', preview: <ThumbnailImageText /> },
  { id: 'section-header', label: 'Бөлүм',         preview: <ThumbnailSectionHeader /> },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface LayoutPickerProps {
  onPick?: () => void
}

export function LayoutPicker({ onPick }: LayoutPickerProps) {
  const { activeSlideId, addSlide } = useSlidesStore()
  const { clearSelection } = useEditorStore()

  const handlePick = (layoutId: SlideLayoutType) => {
    addSlide({ layoutType: layoutId, afterId: activeSlideId ?? undefined })
    clearSelection()
    onPick?.()
  }

  return (
    <div className="p-3 space-y-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Слайд калыбын тандоо</p>
      <div className="grid grid-cols-2 gap-2">
        {LAYOUTS.map(layout => (
          <button
            key={layout.id}
            onClick={() => handlePick(layout.id)}
            className="group flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 border-gray-100 hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50 transition-all hover:shadow-sm active:scale-95"
          >
            <div className="w-full h-[52px] rounded-lg overflow-hidden border border-gray-200 group-hover:border-indigo-200 bg-white">
              {layout.preview}
            </div>
            <span className="text-[10px] font-semibold text-gray-600 group-hover:text-indigo-600 transition-colors leading-tight text-center">
              {layout.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
