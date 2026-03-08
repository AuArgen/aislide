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
  Check, Image, Shapes, Star, Video,
} from 'lucide-react'
import { FloatingTextToolbar } from './editor/FloatingTextToolbar'
import { TypographyPanel } from './editor/TypographyPanel'
import { FontDropdown } from './editor/FontDropdown'
import { useFontManager, ALL_FONTS } from '@/lib/hooks/useFontManager'

// ── Media & Visual Engine imports ────────────────────────────────────────────
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
import { computeSnap } from '@/lib/editor/snapEngine'
import { clientToCanvas, normalizeMarquee, getElementsInMarquee } from '@/lib/editor/marqueeSelection'
import { axisLock } from '@/lib/editor/transformUtils'
import type { AxisLockDominant } from '@/lib/editor/transformUtils'
import type { Rect } from '@/lib/editor/mathUtils'

// ── Slide Management Engine ───────────────────────────────────────────────────
import { useSlidesStore } from '@/store/slidesStore'
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
  if (slide.background) {
    if (slide.background.includes('gradient')) base.background = slide.background
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

  // Skip hidden elements
  if (element.visible === false) return null
  // Skip group containers — they are managed by canvas-level code
  if (isGroup(element)) return null

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
    onSelect(e.shiftKey)
    dragStart.current = { mx: e.clientX, my: e.clientY, ex: element.x, ey: element.y }
    axisLockDominant.current = null
    didDrag.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || isEditing) return
    let dx = e.clientX - dragStart.current.mx
    let dy = e.clientY - dragStart.current.my

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

  return (
    <div
      data-element="true"
      className={`absolute rounded-lg border-2 transition-colors ${
        isSelected
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
  initialPresentation: { id: string; title: string; slides: Slide[]; theme: string }
}

/** Thin shell — seeds the store synchronously then mounts the real editor */
export function PresentationEditor({ initialPresentation }: PresentationEditorProps) {
  function hydrateSlides(raw: Slide[]): Slide[] {
    return raw.map(slide => ({
      ...slide,
      id: slide.id || makeId(),
      elements: (slide.elements || []).map(el => ({
        ...el,
        id: el.id || makeId(),
        x: typeof el.x === 'number' && el.x <= 100 ? el.x * 8 : (el.x || 0),
        y: typeof el.y === 'number' && el.y <= 100 ? el.y * 4.5 : (el.y || 0),
        width: typeof el.width === 'number' && el.width <= 100 ? el.width * 8 : (el.width || 400),
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

  // Shim: keep a local setSlides that also syncs into the store
  const setSlides = useCallback((updater: Slide[] | ((prev: Slide[]) => Slide[])) => {
    const next = typeof updater === 'function' ? updater(slides) : updater
    // Update store: replace entire array
    useSlidesStore.setState({ slides: next })
  }, [slides])

  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const bgImageInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // ── Editor Store ─────────────────────────────────────────────────────────────────
  const {
    selectedIds, selectIds, toggleSelectId, clearSelection,
    snapGuides, setSnapGuides,
    marqueeStart, marqueeEnd, setMarquee,
  } = useEditorStore()

  const selectedElementId = selectedIds[0] ?? null
  const isMultiSelect = selectedIds.length > 1

  // Canvas logical size (coordinate system for elements)
  const CANVAS_W = 800
  const CANVAS_H = 450

  // ── Media overlay state ─────────────────────────────────────────────────
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconPickerTargetId, setIconPickerTargetId] = useState<string | null>(null)

  const { recentFonts, selectFont } = useFontManager()

  const currentSlide = slides[currentSlideIndex]

  const selectedElement = currentSlide?.elements?.find(e => e.id === selectedElementId) ?? null
  const showTypographyPanel = selectedElement && isText(selectedElement) && !isMultiSelect
  const showImagePanel = selectedElement && isImage(selectedElement) && !isMultiSelect
  const showShapePanel = selectedElement && isShape(selectedElement) && !isMultiSelect
  const showIconPanel = selectedElement && isIcon(selectedElement) && !isMultiSelect
  const showVideoPanel = selectedElement && isVideo(selectedElement) && !isMultiSelect
  const showLayersPanel = !showTypographyPanel && !showImagePanel && !showShapePanel && !showIconPanel && !showVideoPanel

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try { await updatePresentation(initialPresentation.id, { slides }) }
    catch { /* silent */ }
    finally { setIsSaving(false) }
  }, [slides, initialPresentation.id])

  useEffect(() => { const t = setTimeout(handleSave, 2000); return () => clearTimeout(t) }, [slides])

  // Realtime
  useEffect(() => {
    const ch = supabase.channel(`presentation:${initialPresentation.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'presentations', filter: `id=eq.${initialPresentation.id}` },
        (payload: Record<string, unknown>) => {
          const np = payload.new as { slides?: Slide[] }
          if (np?.slides && !isSaving) setSlides(np.slides)
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [initialPresentation.id, isSaving])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateSlideField = (index: number, field: keyof Slide, value: unknown) => {
    setSlides(prev => { const s = [...prev]; s[index] = { ...s[index], [field]: value }; return s })
  }

  const updateElement = useCallback(<T extends SlideElement>(id: string, updates: Partial<T>) => {
    setSlides(prev => {
      const s = [...prev]
      s[currentSlideIndex] = {
        ...s[currentSlideIndex],
        elements: s[currentSlideIndex].elements.map(e => e.id === id ? { ...e, ...updates } : e),
      }
      return s
    })
  }, [currentSlideIndex])

  const removeElement = (id: string) => {
    setSlides(prev => {
      const s = [...prev]
      s[currentSlideIndex] = { ...s[currentSlideIndex], elements: s[currentSlideIndex].elements.filter(e => e.id !== id) }
      return s
    })
    if (selectedIds.includes(id)) clearSelection()
  }

  const addElement = (type: SlideElement['type'], extraProps?: Partial<SlideElement>) => {
    const els = currentSlide.elements || []
    const last = els[els.length - 1]
    const newY = last ? Math.min(350, last.y + (last.height || 60) + 20) : 80
    const darkBg = currentSlide.background?.includes('gradient') || currentSlide.background === '#0f172a'

    let el: SlideElement
    switch (type) {
      case 'text':
        el = {
          id: makeId(), type: 'text' as const,
          content: 'Жаңы текст...',
          x: 40, y: newY, width: 440,
          fontSize: 24, color: darkBg ? '#ffffff' : '#1f2937',
          align: 'left' as const, lineHeight: 1.5, opacity: 1,
          ...(extraProps as Partial<import('@/types/elements').TextElement>),
        }
        break
      case 'formula':
        el = { id: makeId(), type: 'formula', content: 'E=mc^2', x: 40, y: newY, width: 300, height: 80 }
        break
      case 'code':
        el = { id: makeId(), type: 'code', content: '// код жазыңыз', x: 40, y: newY, width: 620, height: 200, language: 'javascript' }
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
      if (type === 'pptx') await exportToPPTX(initialPresentation.title, slides.map(s => ({ title: s.title, content: s.elements.map(e => ('content' in e ? e.content : '')).join('\n'), image: s.image })))
      else if (type === 'pdf') await exportToPDF('slide-canvas', initialPresentation.title)
      else await exportToImage('slide-canvas', initialPresentation.title)
    } catch (e) { console.error(e) }
    finally { setIsExporting(false) }
  }

  const navSlide = (dir: 1 | -1) => {
    const nextIdx = Math.max(0, Math.min(slides.length - 1, currentSlideIndex + dir))
    setActiveSlide(slides[nextIdx].id)
    clearSelection()
  }

  // ── Keyboard nudge + delete ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only act when editor has focus and something is selected (not editing text)
      const active = document.activeElement
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active as HTMLElement)?.contentEditable === 'true') return
      if (selectedIds.length === 0) return

      if (e.key === 'Escape') { clearSelection(); return }

      const nudge = e.shiftKey ? 10 : 1
      let dx = 0, dy = 0
      if (e.key === 'ArrowLeft')  { dx = -nudge; e.preventDefault() }
      if (e.key === 'ArrowRight') { dx =  nudge; e.preventDefault() }
      if (e.key === 'ArrowUp')    { dy = -nudge; e.preventDefault() }
      if (e.key === 'ArrowDown')  { dy =  nudge; e.preventDefault() }

      if (dx !== 0 || dy !== 0) {
        selectedIds.forEach(id => {
          const el = slides[currentSlideIndex]?.elements.find(x => x.id === id)
          if (el && !el.locked) updateElement(id, { x: el.x + dx, y: el.y + dy })
        })
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedIds.forEach(id => removeElement(id))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIds, slides, currentSlideIndex, updateElement, removeElement, clearSelection])

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
          onInsert={src => {
            addElement('image', { src } as Partial<ImageElement>)
          }}
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

      {/* ── Left: slide management panel ──────────────────────────────────── */}
      <SlideSidebarPanel
        isSaving={isSaving}
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

        {/* ── TOOLBAR ── */}
        <div className="min-h-[56px] py-2 bg-white border-b border-gray-200 flex flex-wrap items-center px-4 gap-2 shrink-0 shadow-sm relative z-40">
          {selectedElement ? (
            <>
              {/* Font (text elements only) */}
              {(isText(selectedElement)) && (
                <>
                  <FontDropdown value={currentSlide?.style?.fontFamily || 'Inter'} recentFonts={recentFonts} onChange={handleFontChange} />
                  <div className="w-px h-5 bg-gray-200 shrink-0" />
                  {/* Font size */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateElement(selectedElement.id, { fontSize: Math.max(8, (selectedElement.fontSize ?? 24) - 2) })} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">−</button>
                    <span className="w-8 text-center text-xs font-bold text-gray-700">{selectedElement.fontSize ?? 24}</span>
                    <button onClick={() => updateElement(selectedElement.id, { fontSize: Math.min(120, (selectedElement.fontSize ?? 24) + 2) })} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">+</button>
                  </div>
                  <div className="w-px h-5 bg-gray-200 shrink-0" />
                  {/* B / I / U */}
                  <button onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.fontWeight === 'bold' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}><Bold size={13} /></button>
                  <button onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.fontStyle === 'italic' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}><Italic size={13} /></button>
                  <button onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.textDecoration === 'underline' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-700'}`}><Underline size={13} /></button>
                  <div className="w-px h-5 bg-gray-200 shrink-0" />
                  {/* Align */}
                  <button onClick={() => updateElement(selectedElement.id, { align: 'left' })} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${(!selectedElement.align || selectedElement.align === 'left') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}><AlignLeft size={13} /></button>
                  <button onClick={() => updateElement(selectedElement.id, { align: 'center' })} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.align === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}><AlignCenter size={13} /></button>
                  <button onClick={() => updateElement(selectedElement.id, { align: 'right' })} className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${selectedElement.align === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}><AlignRight size={13} /></button>
                  <div className="w-px h-5 bg-gray-200 shrink-0" />
                  {/* Text color */}
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
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
                <div className="text-[10px] text-blue-500 bg-blue-50 px-2 py-1 rounded-lg font-medium">2× = өзгөртүү</div>
                <span className="text-xs text-gray-400">{currentSlideIndex + 1}/{slides.length}</span>
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
                <button onClick={() => updateSlideField(currentSlideIndex, 'style', { ...currentSlide?.style, titleSize: Math.max(16, (currentSlide?.style?.titleSize || 52) - 4) })} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">−</button>
                <span className="w-8 text-center text-xs font-bold text-gray-700">{currentSlide?.style?.titleSize || 52}</span>
                <button onClick={() => updateSlideField(currentSlideIndex, 'style', { ...currentSlide?.style, titleSize: Math.min(120, (currentSlide?.style?.titleSize || 52) + 4) })} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">+</button>
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
              <div className="ml-auto text-xs font-medium text-gray-400 shrink-0">{currentSlideIndex + 1} / {slides.length}</div>
            </>
          )}
        </div>

        {/* ── CANVAS ── */}
        <div className="flex-1 overflow-hidden bg-[#e8eaed] flex flex-col">
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6">
          <div className="w-full" style={{ maxWidth: 'min(calc(100% - 48px), 1200px)' }}>
            {/* Nav row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button onClick={() => navSlide(-1)} disabled={currentSlideIndex === 0} className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 shadow-sm transition-all"><ChevronLeft size={15} /></button>
                <button onClick={() => navSlide(1)} disabled={currentSlideIndex === slides.length - 1} className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 shadow-sm transition-all"><ChevronRight size={15} /></button>
                <span className="text-xs text-gray-500 font-medium self-center ml-1">{currentSlideIndex + 1} / {slides.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Слайд #{currentSlideIndex + 1}</span>
                <button onClick={addSlide} className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"><Plus size={11} /> Слайд</button>
              </div>
            </div>

            {/* Slide canvas */}
            <div
              id="slide-canvas"
              className="w-full rounded-2xl shadow-2xl overflow-hidden"
              style={{ fontFamily: ALL_FONTS.find(f => f.name === (currentSlide?.style?.fontFamily || 'Inter'))?.family }}
            >
              <div
                ref={canvasRef}
                className="aspect-video relative overflow-hidden"
                style={buildSlideStyle(currentSlide)}
                onPointerDown={e => {
                  const target = e.target as HTMLElement
                  if (target.closest('[data-element]')) return
                  // Start marquee
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
                  // Live selection update
                  if (marqueeStart && pos) {
                    const mRect = normalizeMarquee(marqueeStart, pos)
                    const ids = getElementsInMarquee(mRect, currentSlide?.elements ?? [])
                    if (ids.length > 0) selectIds(ids)
                  }
                }}
                onPointerUp={() => {
                  setMarquee(null, null)
                }}
              >
                {/* Title */}
                <input
                  value={currentSlide?.title || ''}
                  onChange={e => updateSlideField(currentSlideIndex, 'title', e.target.value)}
                  placeholder="Аталышы..."
                  className="absolute top-0 left-0 right-0 w-full bg-transparent border-none outline-none font-black px-10 pt-8"
                  style={{ fontSize: `${currentSlide?.style?.titleSize || 52}px`, color: currentSlide?.titleColor || '#1f2937', lineHeight: 1.15, zIndex: 10 }}
                />

                {/* Elements + SelectionBox share the same offset container */}
                <div className="absolute inset-0 top-[120px]">
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

                  {/* SelectionBox lives here so its coordinate origin matches the elements */}
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
              </div>
            </div>
          </div>
          </div>

          {/* ── Speaker Notes Panel ── */}
          <SpeakerNotesPanel />
        </div>
      </div>

      {/* ── Right panel — context-sensitive ───────────────────────────────── */}
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
        <LayersPanel
          elements={currentSlide?.elements ?? []}
          selectedIds={selectedIds}
          onSelectIds={selectIds}
          onUpdateElements={updateElementsOnSlide}
        />
      )}
    </div>
  )
}
