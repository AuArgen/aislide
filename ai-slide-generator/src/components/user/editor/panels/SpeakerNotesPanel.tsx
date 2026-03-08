'use client'

import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { useSlidesStore } from '@/store/slidesStore'

export function SpeakerNotesPanel() {
  const { slides, activeSlideId, updateSpeakerNotes } = useSlidesStore()
  const activeSlide = slides.find(s => s.id === activeSlideId)

  const [collapsed, setCollapsed] = useState(false)
  const [height, setHeight] = useState(120)
  const resizingRef = useRef(false)
  const startYRef = useRef(0)
  const startHRef = useRef(0)

  const onResizeStart = (e: React.MouseEvent) => {
    resizingRef.current = true
    startYRef.current = e.clientY
    startHRef.current = height

    const onMove = (mv: MouseEvent) => {
      if (!resizingRef.current) return
      const delta = startYRef.current - mv.clientY   // drag up = bigger panel
      setHeight(Math.max(60, Math.min(400, startHRef.current + delta)))
    }
    const onUp = () => {
      resizingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="shrink-0 border-t border-gray-200 bg-white relative"
      style={{ height: collapsed ? 32 : height }}
    >
      {/* ── Resize handle ── */}
      {!collapsed && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-400 transition-colors group"
          onMouseDown={onResizeStart}
        >
          <div className="mx-auto mt-0.5 w-8 h-0.5 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors" />
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
          <MessageSquare size={12} />
          Спикер эскертмелери
          {activeSlide?.isHidden && (
            <span className="ml-1 text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">
              ЖАШЫРУУН
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 text-gray-400 transition-colors"
        >
          {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* ── Textarea ── */}
      {!collapsed && (
        <textarea
          className="w-full resize-none outline-none px-3 py-2 text-[13px] text-gray-700 placeholder:text-gray-300 bg-transparent"
          style={{ height: height - 32 }}
          placeholder="Бул слайд боюнча эскертмелерди жазыңыз..."
          value={activeSlide?.speakerNotes ?? ''}
          onChange={e => {
            if (activeSlideId) updateSpeakerNotes(activeSlideId, e.target.value)
          }}
        />
      )}
    </div>
  )
}
