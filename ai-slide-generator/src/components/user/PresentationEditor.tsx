'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { updatePresentation } from '@/lib/actions/user'
import { supabase } from '@/lib/supabase/client'
import { exportToPPTX, exportToPDF, exportToImage } from '@/lib/export'
import 'katex/dist/katex.min.css'
import { BlockMath } from 'react-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Trash, Code, Sigma, Type,
  Plus, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, ChevronLeft, ChevronRight,
  Check, Image, Shapes, Star, Video, Layers, Palette, PanelRight,
} from 'lucide-react'
import { FloatingTextToolbar } from './editor/FloatingTextToolbar'
import { useAutoSave } from '@/lib/hooks/useAutoSave'
import { SyncStatusBadge } from './editor/SyncStatusBadge'
import { TypographyPanel } from './editor/TypographyPanel'
import { FontDropdown } from './editor/FontDropdown'
import { useFontManager, ALL_FONTS } from '@/lib/hooks/useFontManager'

// ── Media & Visual Engine imports ────────────────────────────────────────────
import { ContextMenu } from './editor/ContextMenu'
import { ImageUploader } from './editor/media/ImageUploader'
import { ImageEditor } from './editor/media/ImageEditor'
import { ImageMaskCanvas, MaskSelector } from './editor/media/ImageMaskCanvas'
import { SmartShape } from './editor/shapes/SmartShape'
import { ShapeControls } from './editor/shapes/ShapeControls'
import { IconPicker, IconRenderer, IconControls } from './editor/icons/IconPicker'
import { VideoEmbed, VideoControls } from './editor/media/VideoEmbed'

// ── Advanced Object Manipulation Engine ──────────────────────────────────────
import { useEditorStore } from '@/store/editorStore'
import { SelectionBox } from './editor/canvas/SelectionBox'
import { SnapGuides } from './editor/canvas/SnapGuides'
import { MarqueeBox } from './editor/canvas/MarqueeBox'
import { LayersPanel } from './editor/panels/LayersPanel'
import { AlignmentToolbar } from './editor/panels/AlignmentToolbar'
import { BackgroundPanel } from './editor/panels/BackgroundPanel'
import { ThemePanel } from './editor/panels/ThemePanel'
import { LayoutPicker } from './editor/panels/LayoutPicker'
import { computeSnap } from '@/lib/editor/snapEngine'
import { clientToCanvas, normalizeMarquee, getElementsInMarquee } from '@/lib/editor/marqueeSelection'
import { axisLock } from '@/lib/editor/transformUtils'
import type { AxisLockDominant } from '@/lib/editor/transformUtils'
import type { Rect } from '@/lib/editor/mathUtils'
import { CanvasScaleContext, useCanvasScale } from './editor/canvas/canvasScaleContext'

// ── Slide Management Engine ───────────────────────────────────────────────────
import { useSlidesStore, makeBlankSlide } from '@/store/slidesStore'
import { useThemeStore } from '@/store/themeStore'
import { SlideSidebarPanel } from './editor/sidebar/SlideSidebarPanel'
import { SpeakerNotesPanel } from './editor/panels/SpeakerNotesPanel'

import type {
  SlideElement, Slide,
  ImageElement, ShapeElement, IconElement, VideoElement, MaskShape,
} from '@/types/elements'
import {
  isText, isFormula, isCode, isImage, isShape, isIcon, isVideo, isGroup,
  defaultImageElement, defaultShapeElement, defaultIconElement, defaultVideoElement,
  makeId,
} from '@/types/elements'

// ─── Constants ────────────────────────────────────────────────────────────────

const BG_PRESETS = [
  { label: 'Ак', value: '#ffffff' },
  { label: 'Жарык', value: '#f8fafc' },
  { label: 'Кара', value: '#0f172a' },
  { label: 'Синий', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Жашыл', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { label: 'Закат', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Океан', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Алтын', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { label: 'Күн', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: 'Түн', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSlideStyle(slide: Slide | undefined): React.CSSProperties {
  if (!slide) return { backgroundColor: '#ffffff' }
  const base: React.CSSProperties = {}

  // Prefer the rich `bg` descriptor (new schema)
  const bg = slide.bg
  if (bg) {
    if (bg.type === 'solid') {
      base.backgroundColor = bg.value
    } else if (bg.type === 'gradient') {
      base.backgroundImage = bg.value
    } else if (bg.type === 'image') {
      base.backgroundImage = `url(${bg.value})`
      base.backgroundSize = 'cover'
      base.backgroundPosition = 'center'
    }
  } else if (slide.background) {
    // Legacy: plain hex or gradient CSS string
    if (slide.background.includes('gradient')) base.backgroundImage = slide.background
    else base.backgroundColor = slide.background
  } else {
    base.backgroundColor = '#ffffff'
  }

  // Legacy backgroundImage field still honoured
  if (!bg && slide.backgroundImage) {
    base.backgroundImage = `url(${slide.backgroundImage})`
    base.backgroundSize = 'cover'
    base.backgroundPosition = 'center'
  }

  return base
}

// ─── Element wrapper (engine-integrated) ─────────────────────────────────────

function ElementWrapper({
  element, isSelected, isMultiSelected, onSelect, onUpdate, onRemove,
  otherRects, canvasW, canvasH, onSnapGuides,
}: {
  element: SlideElement
  isSelected: boolean
  isMultiSelected: boolean
  onSelect: (additive: boolean) => void
  onUpdate: (u: Partial<SlideElement>) => void
  onRemove: () => void
  otherRects: Rect[]
  canvasW: number
  canvasH: number
  onSnapGuides: (g: import('@/lib/editor/snapEngine').SnapGuide[]) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const editableRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragStart = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null)
  const didDrag = useRef(false)
  const axisLockDominant = useRef<AxisLockDominant>(null)
  // Screen-pixel deltas must be divided by the CSS scale factor to get canvas coords.
  const canvasScale = useCanvasScale()

  useEffect(() => { if (!isSelected) setIsEditing(false) }, [isSelected])

  useEffect(() => {
    if (!isEditing || !editableRef.current || !isText(element)) return
    if (editableRef.current.innerHTML !== element.content) {
      editableRef.current.innerHTML = element.content || ''
    }
    const el = editableRef.current; el.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el); range.collapse(false)
    sel?.removeAllRanges(); sel?.addRange(range)
  }, [isEditing, element])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isText(element)) return
    const div = editableRef.current
    if (div && !element.heightLocked) {
      const scrollH = div.scrollHeight
      const currentH = element.height ?? 80
      if (scrollH > currentH) {
        onUpdate({ content: e.currentTarget.innerHTML, height: scrollH + 4 } as Partial<SlideElement>)
        return
      }
    }
    onUpdate({ content: e.currentTarget.innerHTML } as Partial<SlideElement>)
  }

  const shrinkToFit = useCallback((newWidth: number, newHeight: number) => {
    if (!isText(element)) return
    const div = editableRef.current
    if (!div) return
    div.style.width = `${newWidth}px`
    div.style.height = `${newHeight}px`
    let fs = element.fontSize ?? 24
    while (div.scrollHeight > newHeight && fs > 8) { fs -= 1; div.style.fontSize = `${fs}px` }
    onUpdate({ width: newWidth, height: newHeight, fontSize: fs, heightLocked: true } as Partial<SlideElement>)
  }, [element, onUpdate])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return
    if (element.locked) return
    if (isEditing) return

    useSlidesStore.getState().saveHistorySnapshot()
    onSelect(e.shiftKey)
    dragStart.current = { mx: e.clientX, my: e.clientY, ex: element.x, ey: element.y }
    axisLockDominant.current = null
    didDrag.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || isEditing) return
    // Convert screen-pixel delta → canvas-coordinate delta by dividing by the
    // CSS transform scale.  Without this, elements move 2× too fast at 0.5× zoom.
    let dx = (e.clientX - dragStart.current.mx) / canvasScale
    let dy = (e.clientY - dragStart.current.my) / canvasScale

    // Axis lock when Shift held
    if (e.shiftKey) {
      const locked = axisLock({ x: dx, y: dy }, axisLockDominant.current)
      axisLockDominant.current = locked.dominant
      dx = locked.result.x
      dy = locked.result.y
    } else {
      axisLockDominant.current = null
    }

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      didDrag.current = true
      const proposed: Rect = {
        x: dragStart.current.ex + dx,
        y: dragStart.current.ey + dy,
        width: element.width ?? 200,
        height: element.height ?? 80,
      }
      const snap = computeSnap(proposed, otherRects, canvasW, canvasH)
      const finalX = proposed.x + (snap.snapX ?? 0)
      const finalY = proposed.y + (snap.snapY ?? 0)
      onSnapGuides(snap.guides)
      onUpdate({ x: finalX, y: finalY } as Partial<SlideElement>)
    }
  }

  const handlePointerUp = () => {
    dragStart.current = null
    axisLockDominant.current = null
    onSnapGuides([])
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if ((isText(element) || isFormula(element) || isCode(element)) && !didDrag.current) setIsEditing(true)
    didDrag.current = false
  }

  const textStyle: React.CSSProperties = isText(element) ? {
    fontSize: `${element.fontSize ?? 24}px`,
    color: element.color ?? '#1f2937',
    fontWeight: element.fontWeight ?? 'normal',
    fontStyle: element.fontStyle ?? 'normal',
    textDecoration: element.textDecoration ?? 'none',
    textAlign: element.align ?? 'left',
    lineHeight: element.lineHeight ?? 1.5,
    letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : undefined,
    textShadow: element.textShadow,
    WebkitTextStroke: element.textStroke as string,
    opacity: element.opacity ?? 1,
    textTransform: (element.textTransform && element.textTransform !== 'none')
      ? element.textTransform as React.CSSProperties['textTransform']
      : undefined,
    columnCount: element.textColumns && element.textColumns > 1 ? element.textColumns : undefined,
    columnGap: element.textColumns && element.textColumns > 1 ? '1.5em' : undefined,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: element.background ?? 'transparent',
    borderRadius: element.background ? 6 : 0,
    padding: '4px',
  } : {}

  const rotation = element.rotation ? `rotate(${element.rotation}deg)` : undefined

  // Skip hidden elements
  if (element.visible === false) return null
  // Skip group containers — they are managed by canvas-level code
  if (isGroup(element)) return null

  return (
    <div
      data-element="true"
      id={`export-el-${element.id}`}
      className={`absolute rounded-lg border-2 transition-colors ${isSelected
        ? 'border-blue-500 shadow-lg z-30'
        : isMultiSelected
          ? 'border-blue-400 z-25'
          : 'border-transparent hover:border-blue-300 z-10'
        } ${isSelected && !isEditing && !element.locked ? 'cursor-move' : 'cursor-default'}
      ${element.locked ? 'cursor-not-allowed opacity-75' : ''}`}
      style={{
        left: element.x, top: element.y,
        width: element.width || 'auto', height: element.height || 'auto',
        transform: rotation,
        opacity: element.opacity ?? 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {isSelected && !element.locked && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-50 shadow"
        >
          <Trash size={11} />
        </button>
      )}
      {isEditing && (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setIsEditing(false) }}
          className="absolute -top-3 -left-3 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center z-50 shadow"
        >
          <Check size={11} />
        </button>
      )}

      {/* ── Text ── */}
      {isText(element) && (
        <div className="w-full h-full min-w-[80px] min-h-[30px]">
          {isEditing ? (
            <div
              ref={editableRef}
              data-rich-text="true"
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setIsEditing(false) } }}
              onPointerDown={e => e.stopPropagation()}
              className="outline-none w-full h-full min-h-[30px] break-words"
              style={{ ...textStyle, cursor: 'text' }}
            />
          ) : (
            <div
              className="w-full h-full overflow-hidden"
              style={textStyle}
              dangerouslySetInnerHTML={{ __html: element.content || '<span style="opacity:0.3">Текст...</span>' }}
            />
          )}
        </div>
      )}

      {/* ── Formula ── */}
      {isFormula(element) && (
        <div className="min-w-[100px] min-h-[40px] w-full h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center p-3 bg-white/20 rounded-lg">
            <BlockMath math={element.content || 'E=mc^2'} />
          </div>
          {isEditing && (
            <textarea
              ref={textareaRef}
              value={element.content}
              onChange={e => onUpdate({ content: e.target.value } as Partial<SlideElement>)}
              onKeyDown={e => { if (e.key === 'Escape') setIsEditing(false) }}
              onPointerDown={e => e.stopPropagation()}
              placeholder="LaTeX формула..."
              className="mt-1 w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs font-mono outline-none resize-none"
              rows={2}
            />
          )}
        </div>
      )}

      {/* ── Code ── */}
      {isCode(element) && (
        <div className="min-w-[300px] rounded-xl overflow-hidden border border-gray-200 flex flex-col w-full h-full">
          <div className="bg-gray-800 px-4 py-1.5 text-[10px] text-gray-400 flex justify-between shrink-0">
            <span className="font-mono">{element.language || 'code'}</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
          </div>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={element.content}
              onChange={e => onUpdate({ content: e.target.value } as Partial<SlideElement>)}
              onKeyDown={e => { if (e.key === 'Escape') setIsEditing(false) }}
              onPointerDown={e => e.stopPropagation()}
              className="flex-1 bg-[#1e1e1e] text-gray-100 font-mono text-sm p-4 outline-none resize-none"
              rows={6}
            />
          ) : (
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
              <SyntaxHighlighter
                language={element.language || 'javascript'}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1rem', fontSize: 14, background: 'transparent' }}
              >
                {element.content}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}

      {/* ── Image ── */}
      {isImage(element) && (
        <ImageMaskCanvas
          element={element}
          isSelected={isSelected}
          onUpdate={u => onUpdate(u as Partial<SlideElement>)}
        />
      )}

      {/* ── Shape ── */}
      {isShape(element) && (
        <SmartShape
          element={element}
          onUpdate={u => onUpdate(u as Partial<SlideElement>)}
        />
      )}

      {/* ── Icon ── */}
      {isIcon(element) && (
        <IconRenderer element={element} />
      )}

      {/* ── Video ── */}
      {isVideo(element) && (
        <VideoEmbed
          element={element}
          onUpdate={u => onUpdate(u as Partial<SlideElement>)}
          presentationMode={false}
        />
      )}
    </div>
  )
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

interface PresentationEditorProps {
  initialPresentation: { id: string; title: string; slides: Slide[]; theme: string; updated_at?: string }
}

/** Thin shell — seeds the store synchronously then mounts the real editor */
export function PresentationEditor({ initialPresentation }: PresentationEditorProps) {
  function hydrateSlides(raw: Slide[]): Slide[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      return [makeBlankSlide('title', { id: makeId() })]
    }
    return raw.map(slide => ({
      ...slide,
      id: slide.id || makeId(),
      elements: (slide.elements || []).map(el => ({
        ...el,
        id: el.id || makeId(),
        x: el.x || 0,
        y: el.y || 0,
        width: el.width || 760,
      }))
    }))
  }

  // Seed the store synchronously so it is never empty when the inner
  // component (which owns all hooks) renders for the first time.
  const state = useSlidesStore.getState()
  if (state.slides.length === 0) {
    state.initSlides(hydrateSlides(initialPresentation.slides))
  }

  return (
    <PresentationEditorInner
      initialPresentation={initialPresentation}
      hydrateSlides={hydrateSlides}
    />
  )
}

// ─── Inner editor — all hooks live here ───────────────────────────────────────

function PresentationEditorInner({
  initialPresentation,
  hydrateSlides,
}: PresentationEditorProps & { hydrateSlides: (raw: Slide[]) => Slide[] }) {
  // ── Slides store ──────────────────────────────────────────────────────────
  const {
    slides, activeSlideId, setActiveSlide, updateSlide, initSlides,
  } = useSlidesStore()

  // Re-init when navigating to a different presentation
  useEffect(() => {
    initSlides(hydrateSlides(initialPresentation.slides))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPresentation.id])

  // Derive current slide index from activeSlideId
  const currentSlideIndex = Math.max(0, slides.findIndex(s => s.id === activeSlideId))

  // Shim: keep a local setSlides that also syncs into the store.
  // Always reads the LATEST store state so rapid pointer-event callbacks
  // never operate on a stale snapshot from a previous render.
  const setSlides = useCallback((updater: Slide[] | ((prev: Slide[]) => Slide[])) => {
    if (typeof updater === 'function') {
      useSlidesStore.setState(state => ({ slides: updater(state.slides) }))
    } else {
      useSlidesStore.setState({ slides: updater })
    }
    // No dependency on `slides` — we read from the store directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // isSaving replaced by useAutoSave — keep a ref so the realtime handler can
  // still gate incoming remote updates while a local save is in-flight.
  const isSavingRef = useRef(false)
  const [isExporting, setIsExporting] = useState(false)
  const bgImageInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // ── Fit-to-screen scale ───────────────────────────────────────────────────
  const canvasAreaRef = useRef<HTMLDivElement>(null)
  const [canvasScale, setCanvasScale] = useState(0.6)

  // ── Editor Store ─────────────────────────────────────────────────────────────────
  const {
    selectedIds, selectIds, toggleSelectId, clearSelection,
    snapGuides, setSnapGuides,
    marqueeStart, marqueeEnd, setMarquee,
  } = useEditorStore()

  const selectedElementId = selectedIds[0] ?? null
  const isMultiSelect = selectedIds.length > 1

  // Canvas fixed base resolution — always 1920×1080; CSS transform scales it to fit.
  const CANVAS_W = 1920
  const CANVAS_H = 1080

  // ResizeObserver: recalculate CSS scale so the 1920×1080 canvas always fits.
  // IMPORTANT: canvasAreaRef must be on the actual viewport div (the flex-1 centering
  // container), NOT on any ancestor that includes toolbar/nav/notes bars — otherwise
  // the measured height includes those elements and the scale is incorrect.
  useEffect(() => {
    const area = canvasAreaRef.current
    if (!area) return
    const PADDING = 40  // 20px breathing room on each side — keeps slide away from viewport edges
    const recompute = () => {
      const availW = area.clientWidth - PADDING
      const availH = area.clientHeight - PADDING
      const scaleX = availW / CANVAS_W
      const scaleY = availH / CANVAS_H
      // Pick the smaller scale so the entire 16:9 rectangle is always visible
      setCanvasScale(Math.min(scaleX, scaleY))
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(area)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Media overlay state ─────────────────────────────────────────────────
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconPickerTargetId, setIconPickerTargetId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)

  const { recentFonts, selectFont } = useFontManager()

  const currentSlide = slides[currentSlideIndex]

  const selectedElement = currentSlide?.elements?.find(e => e.id === selectedElementId) ?? null
  const showTypographyPanel = selectedElement && isText(selectedElement) && !isMultiSelect
  const showImagePanel = selectedElement && isImage(selectedElement) && !isMultiSelect
  const showShapePanel = selectedElement && isShape(selectedElement) && !isMultiSelect
  const showIconPanel = selectedElement && isIcon(selectedElement) && !isMultiSelect
  const showVideoPanel = selectedElement && isVideo(selectedElement) && !isMultiSelect
  const showLayersPanel = !showTypographyPanel && !showImagePanel && !showShapePanel && !showIconPanel && !showVideoPanel

  // ── Right panel: Design tab state ───────────────────────────────────────────
  type RightTab = 'layers' | 'design-bg' | 'design-theme' | 'design-layout'
  const [rightTab, setRightTab] = useState<RightTab>('layers')
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)

  // ── Global theme CSS vars ───────────────────────────────────────────────
  const { activeTheme } = useThemeStore()

  // ── Auto-save (debounced, with offline fallback + tab-close guard) ────────
  const { recoverAvailable, handleRecover, handleDismissRecovery } = useAutoSave({
    slides,
    presentationId: initialPresentation.id,
    serverUpdatedAt: initialPresentation.updated_at,
    updater: async (id, data) => {
      isSavingRef.current = true
      try {
        await updatePresentation(id, data)
      } finally {
        isSavingRef.current = false
      }
    },
    onRecover: (recoveredSlides) => {
      useSlidesStore.setState({ slides: recoveredSlides })
    },
  })


  // Realtime — gate with isSavingRef to avoid stomping in-flight local saves
  useEffect(() => {
    const ch = supabase.channel(`presentation:${initialPresentation.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'presentations', filter: `id=eq.${initialPresentation.id}` },
        (payload: Record<string, unknown>) => {
          const np = payload.new as { slides?: Slide[] }
          if (np?.slides && !isSavingRef.current) setSlides(np.slides)
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPresentation.id])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateSlideField = (index: number, field: keyof Slide, value: unknown) => {
    setSlides(prev => { const s = [...prev]; s[index] = { ...s[index], [field]: value }; return s })
  }

  const updateElement = useCallback(<T extends SlideElement>(id: string, partial: Partial<T>) => {
    useSlidesStore.setState((s) => {
      const activeIdx = s.slides.findIndex(sl => sl.id === s.activeSlideId)
      if (activeIdx === -1) return s
      const slide = s.slides[activeIdx]
      const newElements = slide.elements.map((el) =>
        el.id === id ? { ...el, ...partial } : el
      )
      const newSlides = [...s.slides]
      newSlides[activeIdx] = { ...slide, elements: newElements }
      return { slides: newSlides }
    })
  }, [])

  const removeElement = useCallback((id: string) => {
    useSlidesStore.setState((s) => {
      const activeIdx = s.slides.findIndex(sl => sl.id === s.activeSlideId)
      if (activeIdx === -1) return s
      const slide = s.slides[activeIdx]
      const newElements = slide.elements.filter((el) => el.id !== id)
      const newSlides = [...s.slides]
      newSlides[activeIdx] = { ...slide, elements: newElements }
      return { slides: newSlides }
    })
    if (selectedIds.includes(id)) clearSelection()
  }, [selectedIds, clearSelection])

  const addElement = (type: SlideElement['type'], extraProps?: Partial<SlideElement>) => {
    const els = currentSlide.elements || []
    const last = els[els.length - 1]
    // Default Y stacks below the last element; cap at ~80% of canvas height
    const newY = last ? Math.min(840, last.y + (last.height || 144) + 48) : 288
    const darkBg = currentSlide.background?.includes('gradient') || currentSlide.background === '#0f172a'

    let el: SlideElement
    switch (type) {
      case 'text':
        el = {
          id: makeId(), type: 'text' as const,
          content: 'Жаңы текст...',
          // 1920×1080 coordinate space — ~10% from left, reasonable width
          x: 96, y: newY, width: 1056,
          fontSize: 48, color: darkBg ? '#ffffff' : '#1f2937',
          align: 'left' as const, lineHeight: 1.5, opacity: 1,
          ...(extraProps as Partial<import('@/types/elements').TextElement>),
        }
        break
      case 'formula':
        el = { id: makeId(), type: 'formula', content: 'E=mc^2', x: 96, y: newY, width: 720, height: 192 }
        break
      case 'code':
        el = { id: makeId(), type: 'code', content: '// код жазыңыз', x: 96, y: newY, width: 1488, height: 480, language: 'javascript' }
        break
      case 'image':
        el = defaultImageElement({ y: newY, ...(extraProps as Partial<ImageElement>) })
        break
      case 'shape':
        el = defaultShapeElement({ y: newY, ...(extraProps as Partial<ShapeElement>) })
        break
      case 'icon':
        el = defaultIconElement({ y: newY, ...(extraProps as Partial<IconElement>) })
        break
      case 'video':
        el = defaultVideoElement({ y: newY, ...(extraProps as Partial<VideoElement>) })
        break
      default:
        return
    }

    setSlides(prev => {
      const s = [...prev]
      s[currentSlideIndex] = { ...s[currentSlideIndex], elements: [...(s[currentSlideIndex].elements || []), el] }
      return s
    })
    selectIds([el.id])
  }

  // Slide-level CRUD delegated to slidesStore (via SlideSidebarPanel + hotkeys)
  // These local wrappers are kept for the canvas nav buttons
  const addSlide = () => {
    useSlidesStore.getState().addSlide({ afterId: activeSlideId ?? undefined })
    clearSelection()
  }

  const duplicateSlide = (index: number) => {
    const slide = slides[index]
    if (slide) useSlidesStore.getState().duplicateSlide(slide.id)
  }

  const deleteSlide = (index: number) => {
    const slide = slides[index]
    if (slide && slides.length > 1) useSlidesStore.getState().deleteSlide(slide.id)
    clearSelection()
  }

  // Allow LayersPanel to directly replace the elements array
  const updateElementsOnSlide = useCallback((newElements: SlideElement[]) => {
    setSlides(prev => {
      const s = [...prev]
      s[currentSlideIndex] = { ...s[currentSlideIndex], elements: newElements }
      return s
    })
  }, [currentSlideIndex, setSlides])

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { updateSlideField(currentSlideIndex, 'backgroundImage', ev.target?.result as string) }
    reader.readAsDataURL(file)
  }

  const handleExport = async (type: 'pptx' | 'pdf' | 'png') => {
    setIsExporting(true)
    try {
      if (type === 'pptx') await exportToPPTX(initialPresentation.title, slides)
      else if (type === 'pdf') await exportToPDF('export-container', initialPresentation.title, slides.length)
      else await exportToImage('export-container', initialPresentation.title, slides.length)
    } catch (e: any) {
      console.error(e)
      alert(`Экспорттоо катасы: ${e.message || 'Белгисиз ката'}`)
    }
    finally { setIsExporting(false) }
  }

  const navSlide = (dir: 1 | -1) => {
    const nextIdx = Math.max(0, Math.min(slides.length - 1, currentSlideIndex + dir))
    setActiveSlide(slides[nextIdx].id)
    clearSelection()
  }

  // ── Keyboard nudge + delete + hotkeys ──────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (selectedIds.length === 0) return
    const els = slides[currentSlideIndex]?.elements.filter(e => selectedIds.includes(e.id)) || []
    useEditorStore.getState().setClipboard(els)
  }, [selectedIds, slides, currentSlideIndex])

  const handlePaste = useCallback(() => {
    const cb = useEditorStore.getState().clipboard
    if (cb.length === 0) return

    // Create new IDs and offset slightly
    const newEls = cb.map(el => ({
      ...el,
      id: makeId(),
      x: (el.x || 0) + 20,
      y: (el.y || 0) + 20
    }))

    setSlides(prev => {
      const s = [...prev]
      if (!s[currentSlideIndex]) return s
      // Push history before mutating
      const newHistory = [...useSlidesStore.getState().history, JSON.parse(JSON.stringify(s))]
      if (newHistory.length > 50) newHistory.shift()
      useSlidesStore.setState({ history: newHistory, future: [] })
      s[currentSlideIndex] = {
        ...s[currentSlideIndex],
        elements: [...(s[currentSlideIndex].elements || []), ...newEls]
      }
      return s
    })
    selectIds(newEls.map(e => e.id))
  }, [currentSlideIndex, setSlides, selectIds])

  const handleDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return
    const els = slides[currentSlideIndex]?.elements.filter(e => selectedIds.includes(e.id)) || []
    const newEls = els.map(el => ({
      ...el,
      id: makeId(),
      x: (el.x || 0) + 20,
      y: (el.y || 0) + 20
    }))

    setSlides(prev => {
      const s = [...prev]
      if (!s[currentSlideIndex]) return s
      const newHistory = [...useSlidesStore.getState().history, JSON.parse(JSON.stringify(s))]
      if (newHistory.length > 50) newHistory.shift()
      useSlidesStore.setState({ history: newHistory, future: [] })
      s[currentSlideIndex] = {
        ...s[currentSlideIndex],
        elements: [...(s[currentSlideIndex].elements || []), ...newEls]
      }
      return s
    })
    selectIds(newEls.map(e => e.id))
  }, [selectedIds, slides, currentSlideIndex, setSlides, selectIds])

  const handleBringForward = useCallback(() => {
    if (selectedIds.length === 0) return
    setSlides(prev => {
      const s = [...prev]
      const slide = s[currentSlideIndex]
      if (!slide) return s
      const newHistory = [...useSlidesStore.getState().history, JSON.parse(JSON.stringify(s))]
      if (newHistory.length > 50) newHistory.shift()
      useSlidesStore.setState({ history: newHistory, future: [] })

      const els = [...(slide.elements || [])]
      const toMove = els.filter(e => selectedIds.includes(e.id))
      const others = els.filter(e => !selectedIds.includes(e.id))
      slide.elements = [...others, ...toMove]

      return s
    })
  }, [selectedIds, currentSlideIndex, setSlides])

  const handleSendBackward = useCallback(() => {
    if (selectedIds.length === 0) return
    setSlides(prev => {
      const s = [...prev]
      const slide = s[currentSlideIndex]
      if (!slide) return s
      const newHistory = [...useSlidesStore.getState().history, JSON.parse(JSON.stringify(s))]
      if (newHistory.length > 50) newHistory.shift()
      useSlidesStore.setState({ history: newHistory, future: [] })

      const els = [...(slide.elements || [])]
      const toMove = els.filter(e => selectedIds.includes(e.id))
      const others = els.filter(e => !selectedIds.includes(e.id))
      slide.elements = [...toMove, ...others]

      return s
    })
  }, [selectedIds, currentSlideIndex, setSlides])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only act when editor has focus and something is selected (not editing text)
      const active = document.activeElement
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active as HTMLElement)?.contentEditable === 'true') return

      // Copy / Paste / Cut / Duplicate
      if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        handleCopy()
        return
      }
      if (e.key === 'x' && (e.metaKey || e.ctrlKey)) {
        handleCopy()
        selectedIds.forEach(id => removeElement(id))
        return
      }
      if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
        handlePaste()
        return
      }
      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleDuplicate()
        return
      }

      if (selectedIds.length === 0) return

      if (e.key === 'Escape') { clearSelection(); return }

      // Nudge amounts scaled for 1920×1080 canvas space
      const nudge = e.shiftKey ? 20 : 2
      let dx = 0, dy = 0
      if (e.key === 'ArrowLeft') { dx = -nudge; e.preventDefault() }
      if (e.key === 'ArrowRight') { dx = nudge; e.preventDefault() }
      if (e.key === 'ArrowUp') { dy = -nudge; e.preventDefault() }
      if (e.key === 'ArrowDown') { dy = nudge; e.preventDefault() }

      if (dx !== 0 || dy !== 0) {
        useSlidesStore.getState().saveHistorySnapshot()
        selectedIds.forEach(id => {
          const el = slides[currentSlideIndex]?.elements.find(x => x.id === id)
          if (el && !el.locked) updateElement(id, { x: el.x + dx, y: el.y + dy })
        })
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        useSlidesStore.getState().saveHistorySnapshot()
        selectedIds.forEach(id => removeElement(id))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIds, slides, currentSlideIndex, updateElement, removeElement, clearSelection, handleCopy, handlePaste, handleDuplicate])

  // ── Smart Image Insertion (calculates aspect ratio to prevent cropping) ──────────
  const insertImage = (src: string) => {
    const img = new window.Image()
    img.onload = () => {
      let w = img.naturalWidth
      let h = img.naturalHeight

      const MAX_W = 800
      const MAX_H = 600

      // Scale down if it exceeds max bounds while preserving aspect ratio
      if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h)
        w *= ratio
        h *= ratio
      }

      // Minimum constraints
      w = Math.max(100, Math.round(w))
      h = Math.max(100, Math.round(h))

      useSlidesStore.getState().saveHistorySnapshot()
      addElement('image', { src, width: w, height: h } as Partial<ImageElement>)
    }
    img.src = src
  }

  // ── OS Clipboard Image Paste ───────────────────────────────────────────────────
  useEffect(() => {
    const handleOSPaste = async (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an input
      const active = document.activeElement
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active as HTMLElement)?.contentEditable === 'true') {
        return
      }

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) continue

          // Read image as base64 data URL
          const reader = new FileReader()
          reader.onload = (ev) => {
            const src = ev.target?.result as string
            if (src) {
              insertImage(src)
            }
          }
          reader.readAsDataURL(file)
          break // Only handle first image
        }
      }
    }

    window.addEventListener('paste', handleOSPaste)
    return () => window.removeEventListener('paste', handleOSPaste)
  }, [addElement])

  const handleFontChange = async (fontName: string) => {
    const family = await selectFont(fontName)
    updateSlideField(currentSlideIndex, 'style', { ...currentSlide?.style, fontFamily: fontName, _fontFamily: family })
  }

  // Save slides to DB whenever they change (2s debounce)
  // NB: We also listen for store changes and persist speakerNotes / isHidden
  // ─── Render ────────────────────────────────────────────────────────────────

  // ─── Guard: slide not ready yet (1-frame Zustand hydration gap) ──────────
  if (!currentSlide) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#e8eaed]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Жүктөлүүдө...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#e8eaed]">
      <FloatingTextToolbar />

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showImageUploader && (
        <ImageUploader
          onInsert={src => insertImage(src)}
          onClose={() => setShowImageUploader(false)}
        />
      )}
      {showIconPicker && (
        <IconPicker
          onInsert={(iconName, color) => {
            if (iconPickerTargetId) {
              // Update existing icon's name
              updateElement<IconElement>(iconPickerTargetId, { iconName })
              setIconPickerTargetId(null)
            } else {
              addElement('icon', { iconName, color } as Partial<IconElement>)
            }
          }}
          onClose={() => { setShowIconPicker(false); setIconPickerTargetId(null) }}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAction={(action) => {
            setContextMenu(null)
            switch (action) {
              case 'undo': useSlidesStore.getState().undo(); break;
              case 'redo': useSlidesStore.getState().redo(); break;
              case 'cut':
                handleCopy()
                selectedIds.forEach(id => removeElement(id))
                break;
              case 'copy': handleCopy(); break;
              case 'paste': handlePaste(); break;
              case 'duplicate': handleDuplicate(); break;
              case 'delete': selectedIds.forEach(id => removeElement(id)); break;
              case 'bringForward': handleBringForward(); break;
              case 'sendBackward': handleSendBackward(); break;
            }
          }}
          hasSelection={selectedIds.length > 0}
          hasClipboard={useEditorStore.getState().clipboard.length > 0}
          canUndo={useSlidesStore.getState().history.length > 0}
          canRedo={useSlidesStore.getState().future.length > 0}
        />
      )}

      {/* ── Left: slide management panel ──────────────────────────────────── */}
      <SlideSidebarPanel
        isSaving={isSavingRef.current}
        presentationId={initialPresentation.id}
        onExport={handleExport}
        isExporting={isExporting}
        onCopyShareLink={() => {
          navigator.clipboard.writeText(`${window.location.origin}/presentation/${initialPresentation.id}`)
          alert('Шилтеме көчүрүлдү!')
        }}
      />

      {/* ── Center: toolbar + canvas ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Recovery banner ── */}
        {recoverAvailable && (
          <div className="shrink-0 flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-2 z-50">
            <span className="text-xs font-semibold text-amber-800">⚠️ Сакталбаган жергиликтүү өзгөртүүлөр табылды. Калыбына келтирүүнү каалайсызбы?</span>
            <div className="flex gap-2">
              <button
                onClick={handleRecover}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
              >
                Калыбына келтир
              </button>
              <button
                onClick={handleDismissRecovery}
                className="px-3 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-700 text-xs font-semibold transition-colors"
              >
                Жок
              </button>
            </div>
          </div>
        )}

        {/* ── TOOLBAR ── */}
        <div className="py-2 bg-white border-b border-gray-200 flex flex-wrap items-center px-4 gap-2 shrink-0 shadow-sm relative z-40" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {selectedElement ? (
            <>
              {/* Font (text elements only) */}
              {(isText(selectedElement)) && (
                <>
                  <FontDropdown value={currentSlide?.style?.fontFamily || 'Inter'} recentFonts={recentFonts} onChange={handleFontChange} />
                  <div className="w-px h-5 bg-gray-200 shrink-0" />
                  {/* Font size */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { useSlidesStore.getState().saveHistorySnapshot(); updateElement(selectedElement.id, { fontSize: Math.max(8, (selectedElement.fontSize ?? 24) - 2) }) }} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">−</button>
                    <span className="w-8 text-center text-xs font-bold text-gray-700">{selectedElement.fontSize ?? 24}</span>
                    <button onClick={() => { useSlidesStore.getState().saveHistorySnapshot(); updateElement(selectedElement.id, { fontSize: Math.min(120, (selectedElement.fontSize ?? 24) + 2) }) }} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">+</button>
                  </div>
                  <div className="w-px h-5 bg-gray-200 shrink-0" />
                  {/* B / I / U */}
                  <button onClick={() => { useSlidesStore.getState().saveHistorySnapshot(); updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' }) }} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.fontWeight === 'bold' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}><Bold size={13} /></button>
                  <button onClick={() => { useSlidesStore.getState().saveHistorySnapshot(); updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' }) }} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.fontStyle === 'italic' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}><Italic size={13} /></button>
                  <button onClick={() => { useSlidesStore.getState().saveHistorySnapshot(); updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' }) }} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.textDecoration === 'underline' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}><Underline size={13} /></button>
                  <div className="w-px h-5 bg-gray-200 shrink-0" />
                  {/* Align */}
                  <button onClick={() => { useSlidesStore.getState().saveHistorySnapshot(); updateElement(selectedElement.id, { align: 'left' }) }} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${(!selectedElement.align || selectedElement.align === 'left') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}><AlignLeft size={13} /></button>
                  <button onClick={() => { useSlidesStore.getState().saveHistorySnapshot(); updateElement(selectedElement.id, { align: 'center' }) }} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.align === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}><AlignCenter size={13} /></button>
                  <button onClick={() => { useSlidesStore.getState().saveHistorySnapshot(); updateElement(selectedElement.id, { align: 'right' }) }} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.align === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}><AlignRight size={13} /></button>
                  <div className="w-px h-5 bg-gray-200 shrink-0" />
                  {/* Text color */}
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0" onPointerDown={() => useSlidesStore.getState().saveHistorySnapshot()}>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Текст</span>
                    <div className="relative w-7 h-7">
                      <div className="w-full h-full rounded-full border-2 border-gray-300" style={{ backgroundColor: selectedElement.color || '#1f2937' }} />
                      <input type="color" value={selectedElement.color || '#1f2937'} onChange={e => updateElement(selectedElement.id, { color: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    </div>
                  </label>
                  {/* Element background */}
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Фон</span>
                    <div className="relative w-7 h-7">
                      <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300" style={{ backgroundColor: selectedElement.background || 'transparent' }}>
                        {!selectedElement.background && <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-[9px] font-bold">∅</span>}
                      </div>
                      <input type="color" value={selectedElement.background || '#ffffff'} onChange={e => updateElement(selectedElement.id, { background: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    </div>
                    {selectedElement.background && (
                      <button onClick={() => updateElement(selectedElement.id, { background: undefined })} className="text-[10px] text-red-400 hover:text-red-600 font-bold">✕</button>
                    )}
                  </label>
                </>
              )}

              {/* Image mask selector in toolbar */}
              {isImage(selectedElement) && (
                <MaskSelector
                  layout="toolbar"
                  current={selectedElement.maskShape ?? 'none'}
                  onChange={shape => updateElement<ImageElement>(selectedElement.id, { maskShape: shape as MaskShape })}
                />
              )}

              {/* Alignment toolbar — shown when 2+ elements selected */}
              <AlignmentToolbar
                elements={currentSlide?.elements ?? []}
                selectedIds={selectedIds}
                onUpdateElements={updateElementsOnSlide}
              />

              <div className="ml-auto flex items-center gap-2 shrink-0">
                <SyncStatusBadge />
                <div className="text-[10px] text-blue-500 bg-blue-50 px-2 py-1 rounded-lg font-medium">2× = өзгөртүү</div>
                <span className="text-xs text-gray-400">{currentSlideIndex + 1}/{slides.length}</span>
                <button onClick={() => setIsRightPanelOpen(p => !p)} className={`p-1.5 rounded-lg transition-colors ${isRightPanelOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} title="Оң панелди ачуу / жабуу"><PanelRight size={14} /></button>
              </div>
            </>
          ) : (
            /* ── Slide controls (no element selected) ── */
            <>
              <FontDropdown value={currentSlide?.style?.fontFamily || 'Inter'} recentFonts={recentFonts} onChange={handleFontChange} />
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              {/* Title size */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Аталыш</span>
                <button onClick={() => updateSlideField(currentSlideIndex, 'style', { ...currentSlide?.style, titleSize: Math.max(24, (currentSlide?.style?.titleSize || 96) - 8) })} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">−</button>
                <span className="w-10 text-center text-xs font-bold text-gray-700">{currentSlide?.style?.titleSize || 96}</span>
                <button onClick={() => updateSlideField(currentSlideIndex, 'style', { ...currentSlide?.style, titleSize: Math.min(320, (currentSlide?.style?.titleSize || 96) + 8) })} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">+</button>
              </div>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              {/* Title color */}
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Аталыш түсү</span>
                <div className="relative w-7 h-7">
                  <div className="w-full h-full rounded-full border-2 border-gray-300" style={{ backgroundColor: currentSlide?.titleColor || '#1f2937' }} />
                  <input type="color" value={currentSlide?.titleColor || '#1f2937'} onChange={e => updateSlideField(currentSlideIndex, 'titleColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
              </label>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              {/* BG presets */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Фон:</span>
                {BG_PRESETS.map(p => (
                  <button key={p.value} onClick={() => updateSlideField(currentSlideIndex, 'background', p.value)}
                    className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110 shrink-0"
                    style={{ background: p.value, borderColor: currentSlide?.background === p.value ? '#3b82f6' : '#d1d5db' }}
                    title={p.label} />
                ))}
                <label className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors shrink-0 relative overflow-hidden">
                  <input type="color" value={currentSlide?.background && !currentSlide.background.includes('gradient') ? currentSlide.background : '#ffffff'} onChange={e => updateSlideField(currentSlideIndex, 'background', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-gray-400 text-[10px] font-bold">+</span>
                </label>
              </div>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              {/* BG image */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => bgImageInputRef.current?.click()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition-colors">
                  <Image size={12} /> Фон сурот
                </button>
                {currentSlide?.backgroundImage && (
                  <button onClick={() => updateSlideField(currentSlideIndex, 'backgroundImage', undefined)} className="text-[10px] text-red-400 hover:text-red-600 font-bold px-1">✕ сурот</button>
                )}
                <input ref={bgImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgImage} />
              </div>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              {/* Add elements */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button onClick={() => addElement('text')} className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Type size={11} /> Текст</button>
                <button onClick={() => addElement('formula')} className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Sigma size={11} /> Формула</button>
                <button onClick={() => addElement('code')} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Code size={11} /> Код</button>
                <button onClick={() => addElement('shape')} className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Shapes size={11} /> Фигура</button>
                <button onClick={() => setShowImageUploader(true)} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Image size={11} /> Сурот</button>
                <button onClick={() => setShowIconPicker(true)} className="px-2.5 py-1.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Star size={11} /> Белги</button>
                <button onClick={() => addElement('video')} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Video size={11} /> Видео</button>
              </div>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <SyncStatusBadge />
                <span className="text-xs font-medium text-gray-400">{currentSlideIndex + 1} / {slides.length}</span>
                <button onClick={() => setIsRightPanelOpen(p => !p)} className={`p-1.5 rounded-lg transition-colors ${isRightPanelOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} title="Оң панелди ачуу / жабуу"><PanelRight size={14} /></button>
              </div>
            </>
          )}
        </div>

        {/* ── CANVAS AREA ── */}
        <div className="flex-1 overflow-hidden bg-[#e8eaed] flex flex-col">

          {/* Canvas nav bar — sits above the scaled slide */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 z-10">
            <div className="flex gap-2 items-center">
              <button onClick={() => navSlide(-1)} disabled={currentSlideIndex === 0}
                className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 shadow-sm transition-all">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => navSlide(1)} disabled={currentSlideIndex === slides.length - 1}
                className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 shadow-sm transition-all">
                <ChevronRight size={15} />
              </button>
              <span className="text-xs text-gray-500 font-medium ml-1">{currentSlideIndex + 1} / {slides.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Слайд #{currentSlideIndex + 1}</span>
              <button onClick={addSlide}
                className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors">
                <Plus size={11} /> Слайд
              </button>
            </div>
          </div>

          {/*
           * ── Slide Viewport (Kimi-style) ────────────────────────────────────
           * canvasAreaRef sits here so ResizeObserver only measures the
           * available slide area, excluding the nav bar and notes panel.
           *
           * Architecture:
           *   VIEWPORT  — overflow:hidden flex centering container (this div)
           *   SLIDE     — the true 1920×1080 canvas, scaled via CSS transform
           *               with transformOrigin:'center center'. The flex parent
           *               centres it visually. The slide overflows layout-wise,
           *               which is fine because the viewport clips it.
           *
           * All pointer delta math inside ElementWrapper and SelectionBox must
           * divide by canvasScale to convert screen px → canvas px.
           */}
          <div
            ref={canvasAreaRef}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#f3f4f6',
              position: 'relative',
            }}
          >
            <CanvasScaleContext.Provider value={canvasScale}>
              {/* The slide canvas — true 1920×1080, scaled from centre */}
              <div
                id="slide-canvas"
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ x: e.clientX, y: e.clientY })
                }}
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'center center',
                  flexShrink: 0,
                  position: 'relative',
                  borderRadius: 16,
                  boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                  overflow: 'hidden',
                  fontFamily: ALL_FONTS.find(f => f.name === (currentSlide?.style?.fontFamily || 'Inter'))?.family,
                }}
              >
                <div
                  ref={canvasRef}
                  className="relative overflow-hidden"
                  style={{ width: CANVAS_W, height: CANVAS_H, ...buildSlideStyle(currentSlide) }}
                  onPointerDown={e => {
                    const target = e.target as HTMLElement
                    if (target.closest('[data-element]')) return
                    if (!canvasRef.current) return
                    const canvasRect = canvasRef.current.getBoundingClientRect()
                    const pos = clientToCanvas(e.clientX, e.clientY, canvasRect, CANVAS_W, CANVAS_H)
                    setMarquee(pos, pos)
                    clearSelection()
                  }}
                  onPointerMove={e => {
                    if (!marqueeStart || !canvasRef.current) return
                    const canvasRect = canvasRef.current.getBoundingClientRect()
                    const pos = clientToCanvas(e.clientX, e.clientY, canvasRect, CANVAS_W, CANVAS_H)
                    setMarquee(marqueeStart, pos)
                    if (marqueeStart && pos) {
                      const mRect = normalizeMarquee(marqueeStart, pos)
                      const ids = getElementsInMarquee(mRect, currentSlide?.elements ?? [])
                      if (ids.length > 0) selectIds(ids)
                    }
                  }}
                  onPointerUp={() => setMarquee(null, null)}
                >
                  {/* Image overlay (for SlideBackground type='image') */}
                  {currentSlide?.bg?.type === 'image' && (currentSlide.bg.overlayOpacity ?? 0) > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: currentSlide.bg.overlayColor ?? '#000000',
                        opacity: currentSlide.bg.overlayOpacity ?? 0,
                        zIndex: 1,
                      }}
                    />
                  )}
                  {/* Elements + SelectionBox share the same offset container */}
                  <div className="absolute inset-0" style={{ zIndex: 20 }}>
                    {currentSlide?.elements?.map(el => {
                      const isSelected = selectedIds.length === 1 && selectedIds[0] === el.id
                      const isMultiSelected = selectedIds.includes(el.id)
                      const otherRects = (currentSlide?.elements ?? [])
                        .filter(x => x.id !== el.id && x.visible !== false)
                        .map(x => ({ x: x.x, y: x.y, width: x.width ?? 0, height: x.height ?? 0 }))
                      return (
                        <ElementWrapper
                          key={el.id}
                          element={el}
                          isSelected={isSelected}
                          isMultiSelected={isMultiSelected}
                          onSelect={(additive) => {
                            if (additive) toggleSelectId(el.id)
                            else selectIds([el.id])
                          }}
                          onUpdate={updates => updateElement(el.id, updates as Partial<typeof el>)}
                          onRemove={() => removeElement(el.id)}
                          otherRects={otherRects}
                          canvasW={CANVAS_W}
                          canvasH={CANVAS_H}
                          onSnapGuides={setSnapGuides}
                        />
                      )
                    })}

                    {/* SelectionBox lives here so its coordinate origin matches elements */}
                    {selectedElementId && !isMultiSelect && (() => {
                      const el = currentSlide?.elements?.find(x => x.id === selectedElementId)
                      if (!el || el.visible === false || el.locked || isGroup(el)) return null
                      const rect = { x: el.x, y: el.y, width: el.width ?? 200, height: el.height ?? 80 }
                      return (
                        <SelectionBox
                          rect={rect}
                          rotation={el.rotation}
                          isImage={isImage(el)}
                          onResize={newRect => updateElement(selectedElementId, newRect as Partial<SlideElement>)}
                          onRotate={angle => updateElement(selectedElementId, { rotation: angle } as Partial<SlideElement>)}
                        />
                      )
                    })()}
                  </div>

                  {/* Snap guides overlay */}
                  <SnapGuides guides={snapGuides} canvasW={CANVAS_W} canvasH={CANVAS_H} />

                  {/* Marquee box */}
                  {marqueeStart && marqueeEnd && (
                    <MarqueeBox start={marqueeStart} end={marqueeEnd} />
                  )}
                </div>{/* end canvasRef */}
              </div>{/* end slide canvas */}
            </CanvasScaleContext.Provider>
          </div>{/* end slide viewport */}


          {/* ── Speaker Notes Panel ── */}
          <SpeakerNotesPanel />
        </div>
      </div>

      {/* ── Right panel — context-sensitive ───────────────────────────────── */}
      {isRightPanelOpen && (
        <>
          {showTypographyPanel && selectedElement && (
            <TypographyPanel
              element={selectedElement}
              onUpdate={updates => updateElement(selectedElement.id, updates)}
            />
          )}
          {showImagePanel && selectedElement && isImage(selectedElement) && (
            <ImageEditor
              element={selectedElement}
              onUpdate={updates => updateElement<ImageElement>(selectedElement.id, updates)}
            />
          )}
          {showShapePanel && selectedElement && isShape(selectedElement) && (
            <ShapeControls
              element={selectedElement}
              onUpdate={updates => updateElement<ShapeElement>(selectedElement.id, updates)}
            />
          )}
          {showIconPanel && selectedElement && isIcon(selectedElement) && (
            <IconControls
              element={selectedElement}
              onUpdate={updates => updateElement<IconElement>(selectedElement.id, updates)}
              onOpenPicker={() => {
                setIconPickerTargetId(selectedElement.id)
                setShowIconPicker(true)
              }}
            />
          )}
          {showVideoPanel && selectedElement && isVideo(selectedElement) && (
            <VideoControls
              element={selectedElement}
              onUpdate={updates => updateElement<VideoElement>(selectedElement.id, updates)}
            />
          )}
          {showLayersPanel && (
            <div
              className="w-[240px] shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-sm overflow-hidden"
              style={{
                '--theme-primary': activeTheme.colors.primary,
                '--theme-secondary': activeTheme.colors.secondary,
                '--theme-text': activeTheme.colors.text,
                '--theme-background': activeTheme.colors.background,
                '--theme-accent': activeTheme.colors.accent,
              } as React.CSSProperties}
            >
              {/* Tab header */}
              <div className="flex border-b border-gray-100 shrink-0">
                <button
                  onClick={() => setRightTab('layers')}
                  className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors
                ${rightTab === 'layers'
                      ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                      : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Layers size={12} /> Катмарлар
                </button>
                <button
                  onClick={() => setRightTab(t => t === 'layers' ? 'design-bg' : t)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors
                ${rightTab !== 'layers'
                      ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                      : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Palette size={12} /> Дизайн
                </button>
              </div>

              {/* Layers tab */}
              {rightTab === 'layers' && (
                <LayersPanel
                  elements={currentSlide?.elements ?? []}
                  selectedIds={selectedIds}
                  onSelectIds={selectIds}
                  onUpdateElements={updateElementsOnSlide}
                />
              )}

              {/* Design tabs */}
              {rightTab !== 'layers' && (
                <>
                  {/* Design sub-tabs */}
                  <div className="flex border-b border-gray-100 bg-gray-50 shrink-0 px-1 pt-1 gap-0.5">
                    {([
                      { id: 'design-bg' as RightTab, label: 'Фон' },
                      { id: 'design-theme' as RightTab, label: 'Тема' },
                      { id: 'design-layout' as RightTab, label: 'Макет' },
                    ] as { id: RightTab; label: string }[]).map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setRightTab(id)}
                        className={`flex-1 text-[10px] font-bold py-1.5 rounded-t-lg transition-colors
                      ${rightTab === id
                            ? 'bg-white text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Sub-tab content */}
                  <div className="flex-1 overflow-hidden">
                    {rightTab === 'design-bg' && <BackgroundPanel />}
                    {rightTab === 'design-theme' && <ThemePanel />}
                    {rightTab === 'design-layout' && <LayoutPicker />}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Hidden Export Container (1:1 scale, all slides) ── */}
      <div
        id="export-container"
        className="fixed top-0 left-0 pointer-events-none opacity-0 flex flex-col"
        style={{ zIndex: -9999 }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            id={`export-slide-${index}`}
            className="relative overflow-hidden shrink-0"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              ...buildSlideStyle(slide),
              fontFamily: slide.style?.fontFamily || 'Inter, sans-serif'
            }}
          >
            {slide.elements.map(el => (
              <ElementWrapper
                key={el.id}
                element={el}
                isSelected={false}
                isMultiSelected={false}
                onSelect={() => { }}
                onUpdate={() => { }}
                onRemove={() => { }}
                otherRects={[]}
                canvasW={CANVAS_W}
                canvasH={CANVAS_H}
                onSnapGuides={() => { }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
