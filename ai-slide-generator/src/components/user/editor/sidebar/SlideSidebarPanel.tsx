'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Plus, Layout, Home } from 'lucide-react'
import Link from 'next/link'
import { useSlidesStore } from '@/store/slidesStore'
import { SlideThumbnail } from './SlideThumbnail'
import { useSlideHotkeys } from '@/lib/hooks/useSlideHotkeys'
import { presentationTemplates } from '@/lib/templates'
import type { Slide, SlideLayoutType } from '@/types/elements'

interface SlideSidebarPanelProps {
  isSaving: boolean
  presentationId: string
  onExport: (type: 'pptx' | 'pdf' | 'png') => void
  isExporting: boolean
  onCopyShareLink: () => void
}

// ── Drop indicator position ────────────────────────────────────────────────────
interface DragState {
  draggingIndex: number
  overIndex: number   // insertion point (0 = before first, slides.length = after last)
}

const EDGE_SCROLL_ZONE = 48  // px from top/bottom to trigger auto-scroll
const EDGE_SCROLL_SPEED = 6   // px per frame

export function SlideSidebarPanel({
  isSaving,
  presentationId,
  onExport,
  isExporting,
  onCopyShareLink,
}: SlideSidebarPanelProps) {
  const {
    slides, activeSlideId,
    setActiveSlide, addSlide, deleteSlide, duplicateSlide,
    reorderSlides, toggleHideSlide, updateSlide,
  } = useSlidesStore()

  useSlideHotkeys()

  const listRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const rafRef = useRef<number | null>(null)
  const pointerYRef = useRef(0)

  // ── Drag-and-drop ─────────────────────────────────────────────────────────────
  const handleDragHandlePointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      e.preventDefault()
      e.stopPropagation()
      setDrag({ draggingIndex: idx, overIndex: idx })

      const onMove = (mv: PointerEvent) => {
        pointerYRef.current = mv.clientY
        if (!listRef.current) return
        const items = listRef.current.querySelectorAll<HTMLDivElement>('[data-slide-item]')

        let hoverIndex = idx;
        items.forEach((item, i) => {
          const { top, height } = item.getBoundingClientRect()
          // Midpoint approach works, but let's just find the exact item the pointer is over
          // Or just threshold using the center of each item
          if (mv.clientY >= top && mv.clientY <= top + height) {
            hoverIndex = i;
          }
        })

        setDrag(d => d ? { ...d, overIndex: hoverIndex } : d)
      }

      const onUp = () => {
        setDrag(d => {
          if (d && d.draggingIndex !== d.overIndex) {
            setTimeout(() => {
              reorderSlides(d.draggingIndex, d.overIndex)
            }, 0)
          }
          return null
        })
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)

      // Start edge-scroll loop
      const edgeScroll = () => {
        if (!listRef.current) return
        const { top, bottom } = listRef.current.getBoundingClientRect()
        const py = pointerYRef.current
        if (py < top + EDGE_SCROLL_ZONE) {
          listRef.current.scrollTop -= EDGE_SCROLL_SPEED
        } else if (py > bottom - EDGE_SCROLL_ZONE) {
          listRef.current.scrollTop += EDGE_SCROLL_SPEED
        }
        rafRef.current = requestAnimationFrame(edgeScroll)
      }
      rafRef.current = requestAnimationFrame(edgeScroll)
    },
    [slides.length, reorderSlides],
  )

  // Cleanup RAF on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const activeIndex = slides.findIndex(s => s.id === activeSlideId)

  // ── Layout-picker menu close on outside click ──────────────────────────────
  useEffect(() => {
    if (!showLayoutMenu) return
    const close = () => setShowLayoutMenu(false)
    setTimeout(() => window.addEventListener('pointerdown', close), 10)
    return () => window.removeEventListener('pointerdown', close)
  }, [showLayoutMenu])

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div data-sidebar-panel className="w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="px-3 py-2 border-b border-gray-100 flex flex-col gap-2 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 px-2 py-1.5 rounded-lg w-max">
          <Home size={12} /> Башкы бет
        </Link>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-700 text-sm">Слайддар</h3>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${isSaving ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-gray-100 text-gray-400'
                }`}
            >
              {isSaving ? 'Сакталууда...' : 'Сакталды'}
            </span>
            {/* Add slide — click opens layout picker */}
            <div className="relative">
              <button
                title="Слайд кошуу"
                onClick={() => setShowLayoutMenu(m => !m)}
                className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus size={14} />
              </button>
              {showLayoutMenu && (
                <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[150px]">
                  {(
                    [
                      { key: 'blank' as SlideLayoutType, label: '⬜ Бош слайд' },
                      { key: 'title' as SlideLayoutType, label: '📋 Аталыш' },
                      { key: 'title-body' as SlideLayoutType, label: '📄 Аталыш + Текст' },
                      { key: 'two-column' as SlideLayoutType, label: '⣿ Эки мамыча' },
                    ] as { key: SlideLayoutType; label: string }[]
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => {
                        addSlide({ layoutType: key, afterId: activeSlideId ?? undefined })
                        setShowLayoutMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Export ── */}
      <div className="px-3 py-2.5 border-b border-gray-100 space-y-1.5 shrink-0">
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => onExport('pptx')} disabled={isExporting}
            className="text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1.5 rounded-lg font-semibold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all flex items-center justify-center gap-1">
            ↓ PPTX
          </button>
          <button onClick={() => onExport('pdf')} disabled={isExporting}
            className="text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1.5 rounded-lg font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-all flex items-center justify-center gap-1">
            ↓ PDF
          </button>
        </div>
        <button onClick={() => onExport('png')} disabled={isExporting}
          className="w-full text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1.5 rounded-lg font-semibold hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-50 transition-all flex items-center justify-center gap-1">
          ↓ PNG
        </button>
        <button onClick={onCopyShareLink}
          className="w-full text-[11px] bg-indigo-600 text-white px-2 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-1">
          🔗 Бөлүшүү
        </button>
      </div>

      {/* ── Slide list with DnD ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-2.5"
      >
        {slides.map((slide, i) => {
          const isOver = drag !== null && drag.overIndex === i && drag.draggingIndex !== i
          const movingDown = isOver && drag!.draggingIndex < i
          const movingUp = isOver && drag!.draggingIndex > i

          return (
            <div key={slide.id} data-slide-item className="mb-2">
              {/* ── Drop indicator above ── */}
              {movingUp && (
                <div className="h-0.5 w-full bg-blue-500 rounded-full mb-1.5 shadow-sm shadow-blue-400" />
              )}

              <SlideThumbnail
                slide={slide}
                index={i}
                isActive={slide.id === activeSlideId}
                isDragging={drag?.draggingIndex === i}
                onSelect={() => setActiveSlide(slide.id)}
                onDuplicate={() => duplicateSlide(slide.id)}
                onDelete={() => slides.length > 1 && deleteSlide(slide.id)}
                onToggleHide={() => toggleHideSlide(slide.id)}
                onDragHandlePointerDown={e => handleDragHandlePointerDown(e, i)}
              />

              {/* ── Drop indicator below ── */}
              {movingDown && (
                <div className="h-0.5 w-full bg-blue-500 rounded-full mt-1.5 shadow-sm shadow-blue-400" />
              )}
            </div>
          )
        })}

        {/* ── Slide count footer ── */}
        <p className="text-center text-[10px] text-gray-400 mt-1 font-medium">
          {activeIndex + 1} / {slides.length} слайд
        </p>
      </div>

      {/* ── Templates ── */}
      <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Layout size={10} /> Калыптар
        </p>
        <div className="space-y-1">
          {presentationTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => {
                const tp = presentationTemplates.find(x => x.id === t.id)
                if (tp && confirm('Слайддар алмаштырылат. Улантасызбы?')) {
                  // Replace all slides via updateSlide store; we hydrate ids via initSlides
                  useSlidesStore.getState().initSlides(
                    (tp.slides as unknown as Slide[]).map(s => ({ ...s, id: s.id || Math.random().toString(36).substr(2, 9) }))
                  )
                }
              }}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 text-[11px] font-semibold text-gray-600 transition-colors"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
