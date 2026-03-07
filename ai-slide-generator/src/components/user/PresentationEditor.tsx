'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { updatePresentation } from '@/lib/actions/user'
import { supabase } from '@/lib/supabase/client'
import { exportToPPTX, exportToPDF, exportToImage } from '@/lib/export'
import 'katex/dist/katex.min.css'
import { BlockMath } from 'react-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Trash, Code, Sigma, Type, Layout,
  Plus, Copy, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, ChevronLeft, ChevronRight,
  Share2, Download, Check, Strikethrough, Image, Palette
} from 'lucide-react'
import { presentationTemplates } from '@/lib/templates'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SlideElement {
  id: string
  type: 'text' | 'formula' | 'code' | 'image'
  content: string
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
  color?: string
  background?: string
  align?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  language?: string
}

interface Slide {
  title: string
  elements: SlideElement[]
  image?: string
  background?: string
  backgroundImage?: string
  titleColor?: string
  style?: {
    titleSize?: number
    fontFamily?: string
  }
}

interface PresentationEditorProps {
  initialPresentation: {
    id: string
    title: string
    slides: Slide[]
    theme: string
  }
}

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

const TEXT_PALETTE = ['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

const FONTS = [
  { name: 'Inter', family: 'var(--font-inter), sans-serif' },
  { name: 'Serif', family: 'Georgia, serif' },
  { name: 'Mono', family: 'monospace' },
  { name: 'Outfit', family: 'Outfit, sans-serif' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSlideStyle(slide: Slide): React.CSSProperties {
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

// ─── Floating text selection toolbar ─────────────────────────────────────────

function FloatingTextToolbar() {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const savedRange = useRef<Range | null>(null)

  useEffect(() => {
    const onSelChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setPos(null); return }
      const node = sel.anchorNode
      const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement
      if (!el?.closest('[data-rich-text]')) { setPos(null); return }
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (rect.width === 0) { setPos(null); return }
      savedRange.current = range.cloneRange()
      setPos({ top: rect.top + window.scrollY - 52, left: rect.left + window.scrollX + rect.width / 2 })
    }
    document.addEventListener('selectionchange', onSelChange)
    return () => document.removeEventListener('selectionchange', onSelChange)
  }, [])

  const restoreSel = () => {
    if (!savedRange.current) return false
    const sel = window.getSelection()
    if (!sel) return false
    sel.removeAllRanges()
    sel.addRange(savedRange.current)
    return true
  }

  const exec = (cmd: string, value?: string) => {
    restoreSel()
    document.execCommand(cmd, false, value)
  }

  const applyStyle = (prop: string, value: string) => {
    if (!restoreSel()) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    ;(span.style as any)[prop] = value
    try { range.surroundContents(span) }
    catch { const frag = range.extractContents(); span.appendChild(frag); range.insertNode(span) }
    const nr = document.createRange()
    nr.selectNodeContents(span)
    sel.removeAllRanges(); sel.addRange(nr)
    savedRange.current = nr.cloneRange()
  }

  const applyFontSize = (delta: number) => {
    if (!restoreSel()) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const node = sel.anchorNode
    const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement
    const cur = parseFloat(window.getComputedStyle(el!).fontSize) || 24
    applyStyle('fontSize', `${Math.max(8, Math.min(120, cur + delta))}px`)
  }

  if (!pos) return null

  return createPortal(
    <div
      className="absolute z-[9999] bg-gray-900 rounded-xl shadow-2xl flex items-center gap-0.5 px-2 py-1.5 -translate-x-1/2 select-none"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={e => e.preventDefault()}
    >
      <button onMouseDown={e => { e.preventDefault(); exec('bold') }} className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center transition-colors" title="Жоон"><Bold size={13} className="text-white" /></button>
      <button onMouseDown={e => { e.preventDefault(); exec('italic') }} className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center transition-colors" title="Курсив"><Italic size={13} className="text-white" /></button>
      <button onMouseDown={e => { e.preventDefault(); exec('underline') }} className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center transition-colors" title="Астыңкы сызык"><Underline size={13} className="text-white" /></button>
      <button onMouseDown={e => { e.preventDefault(); exec('strikeThrough') }} className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center transition-colors" title="Сызылган"><Strikethrough size={13} className="text-white" /></button>
      <div className="w-px h-4 bg-gray-600 mx-1" />
      <button onMouseDown={e => { e.preventDefault(); applyFontSize(-2) }} className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center text-white font-bold text-sm transition-colors">−</button>
      <button onMouseDown={e => { e.preventDefault(); applyFontSize(2) }} className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center text-white font-bold text-sm transition-colors">+</button>
      <div className="w-px h-4 bg-gray-600 mx-1" />
      {TEXT_PALETTE.map(c => (
        <button key={c} onMouseDown={e => { e.preventDefault(); exec('foreColor', c) }} className="w-4 h-4 rounded-full border border-gray-500 hover:scale-125 transition-transform shrink-0" style={{ backgroundColor: c }} title={c} />
      ))}
      <label className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:border-white transition-colors ml-0.5 shrink-0 relative overflow-hidden" title="Башка түс">
        <input type="color" className="opacity-0 absolute w-0 h-0" onMouseDown={restoreSel} onChange={e => exec('foreColor', e.target.value)} />
        <span className="text-gray-400 text-[9px] font-bold">+</span>
      </label>
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
    </div>,
    document.body
  )
}

// ─── Resize handle ────────────────────────────────────────────────────────────

function ResizeHandle({ direction, onResize }: { direction: 'e' | 's' | 'se' | 'w'; onResize: (dx: number, dy: number) => void }) {
  const cls: Record<string, string> = {
    e:  'right-[-5px] top-1/2 -translate-y-1/2 cursor-ew-resize w-3 h-8 rounded-sm',
    w:  'left-[-5px]  top-1/2 -translate-y-1/2 cursor-ew-resize w-3 h-8 rounded-sm',
    s:  'bottom-[-5px] left-1/2 -translate-x-1/2 cursor-ns-resize h-3 w-8 rounded-sm',
    se: 'bottom-[-6px] right-[-6px] cursor-nwse-resize w-5 h-5 rounded-full',
  }
  return (
    <div
      className={`absolute bg-blue-500 border-2 border-white shadow z-50 ${cls[direction]}`}
      onPointerDown={e => {
        e.stopPropagation(); e.preventDefault()
        const sx = e.clientX, sy = e.clientY
        const onMove = (ev: PointerEvent) => onResize(ev.clientX - sx, ev.clientY - sy)
        const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      }}
    />
  )
}

// ─── Element wrapper ──────────────────────────────────────────────────────────

function ElementWrapper({
  element, isSelected, onSelect, onUpdate, onRemove,
}: {
  element: SlideElement
  isSelected: boolean
  onSelect: () => void
  onUpdate: (u: Partial<SlideElement>) => void
  onRemove: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const editableRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragStart = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null)
  const didDrag = useRef(false)

  useEffect(() => { if (!isSelected) setIsEditing(false) }, [isSelected])

  useEffect(() => {
    if (!isEditing || !editableRef.current || element.type !== 'text') return
    if (editableRef.current.innerHTML !== element.content) {
      editableRef.current.innerHTML = element.content || ''
    }
    const el = editableRef.current; el.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el); range.collapse(false)
    sel?.removeAllRanges(); sel?.addRange(range)
  }, [isEditing])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return
    onSelect()
    dragStart.current = { mx: e.clientX, my: e.clientY, ex: element.x, ey: element.y }
    didDrag.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || isEditing) return
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      didDrag.current = true
      onUpdate({ x: dragStart.current.ex + dx, y: dragStart.current.ey + dy })
    }
  }

  const handlePointerUp = () => { dragStart.current = null }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (element.type === 'text' && !didDrag.current) setIsEditing(true)
    didDrag.current = false
  }

  const textStyle: React.CSSProperties = {
    fontSize: `${element.fontSize || 24}px`,
    color: element.color || '#1f2937',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    textAlign: element.align || 'left',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: element.background || 'transparent',
    borderRadius: element.background ? 6 : 0,
    padding: '4px',
  }

  return (
    <div
      data-element="true"
      className={`absolute rounded-lg border-2 transition-colors ${
        isSelected ? 'border-blue-500 shadow-lg z-30' : 'border-transparent hover:border-blue-300 z-10'
      } ${isSelected && !isEditing ? 'cursor-move' : 'cursor-default'}`}
      style={{ left: element.x, top: element.y, width: element.width || 'auto', height: element.height || 'auto' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {isSelected && (
        <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onRemove() }} className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center z-50 shadow">
          <Trash size={11} />
        </button>
      )}
      {isEditing && (
        <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setIsEditing(false) }} className="absolute -top-3 -left-3 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center z-50 shadow">
          <Check size={11} />
        </button>
      )}
      {isSelected && !isEditing && (
        <>
          <ResizeHandle direction="e"  onResize={dx => onUpdate({ width: Math.max(80, (element.width || 200) + dx) })} />
          <ResizeHandle direction="w"  onResize={dx => { const nw = Math.max(80, (element.width || 200) - dx); onUpdate({ x: element.x + (element.width || 200) - nw, width: nw }) }} />
          <ResizeHandle direction="s"  onResize={(_, dy) => onUpdate({ height: Math.max(30, (element.height || 80) + dy) })} />
          <ResizeHandle direction="se" onResize={(dx, dy) => onUpdate({ width: Math.max(80, (element.width || 200) + dx), height: Math.max(30, (element.height || 80) + dy) })} />
        </>
      )}

      {/* Text */}
      {element.type === 'text' && (
        <div className="w-full h-full min-w-[80px] min-h-[30px]">
          {isEditing ? (
            <div
              ref={editableRef}
              data-rich-text="true"
              contentEditable
              suppressContentEditableWarning
              onInput={e => onUpdate({ content: e.currentTarget.innerHTML })}
              onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setIsEditing(false) } }}
              onPointerDown={e => e.stopPropagation()}
              className="outline-none w-full h-full min-h-[30px] break-words"
              style={{ ...textStyle, cursor: 'text' }}
            />
          ) : (
            <div className="w-full h-full overflow-hidden" style={textStyle} dangerouslySetInnerHTML={{ __html: element.content || '<span style="opacity:0.3">Текст...</span>' }} />
          )}
        </div>
      )}

      {/* Formula */}
      {element.type === 'formula' && (
        <div className="min-w-[100px] min-h-[40px] w-full h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center p-3 bg-white/20 rounded-lg">
            <BlockMath math={element.content || 'E=mc^2'} />
          </div>
          {isEditing && (
            <textarea ref={textareaRef} value={element.content} onChange={e => onUpdate({ content: e.target.value })} onKeyDown={e => { if (e.key === 'Escape') setIsEditing(false) }} onPointerDown={e => e.stopPropagation()} placeholder="LaTeX формула..." className="mt-1 w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs font-mono outline-none resize-none" rows={2} />
          )}
        </div>
      )}

      {/* Code */}
      {element.type === 'code' && (
        <div className="min-w-[300px] rounded-xl overflow-hidden border border-gray-200 flex flex-col w-full h-full">
          <div className="bg-gray-800 px-4 py-1.5 text-[10px] text-gray-400 flex justify-between shrink-0">
            <span className="font-mono">{element.language || 'code'}</span>
            <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50" /><div className="w-2 h-2 rounded-full bg-yellow-500/50" /><div className="w-2 h-2 rounded-full bg-green-500/50" /></div>
          </div>
          {isEditing ? (
            <textarea ref={textareaRef} value={element.content} onChange={e => onUpdate({ content: e.target.value })} onKeyDown={e => { if (e.key === 'Escape') setIsEditing(false) }} onPointerDown={e => e.stopPropagation()} className="flex-1 bg-[#1e1e1e] text-gray-100 font-mono text-sm p-4 outline-none resize-none" rows={6} />
          ) : (
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
              <SyntaxHighlighter language={element.language || 'javascript'} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', fontSize: 14, background: 'transparent' }}>{element.content}</SyntaxHighlighter>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function PresentationEditor({ initialPresentation }: PresentationEditorProps) {
  const [slides, setSlides] = useState<Slide[]>(() =>
    initialPresentation.slides.map(slide => ({
      ...slide,
      elements: (slide.elements || []).map(el => ({
        ...el,
        id: el.id || Math.random().toString(36).substr(2, 9),
        x: typeof el.x === 'number' && el.x <= 100 ? el.x * 8 : (el.x || 0),
        y: typeof el.y === 'number' && el.y <= 100 ? el.y * 4.5 : (el.y || 0),
        width: typeof el.width === 'number' && el.width <= 100 ? el.width * 8 : (el.width || 400),
      }))
    }))
  )

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const bgImageInputRef = useRef<HTMLInputElement>(null)

  const currentSlide = slides[currentSlideIndex]
  const selectedElement = currentSlide?.elements?.find(e => e.id === selectedElementId) ?? null

  // Auto-save
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
        (payload: any) => { if (payload.new?.slides && !isSaving) setSlides(payload.new.slides) })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [initialPresentation.id, isSaving])

  // Slide helpers
  const updateSlideField = (index: number, field: keyof Slide, value: any) => {
    setSlides(prev => { const s = [...prev]; s[index] = { ...s[index], [field]: value }; return s })
  }

  const updateElement = useCallback((id: string, updates: Partial<SlideElement>) => {
    setSlides(prev => {
      const s = [...prev]
      s[currentSlideIndex] = { ...s[currentSlideIndex], elements: s[currentSlideIndex].elements.map(e => e.id === id ? { ...e, ...updates } : e) }
      return s
    })
  }, [currentSlideIndex])

  const removeElement = (id: string) => {
    setSlides(prev => {
      const s = [...prev]
      s[currentSlideIndex] = { ...s[currentSlideIndex], elements: s[currentSlideIndex].elements.filter(e => e.id !== id) }
      return s
    })
    if (selectedElementId === id) setSelectedElementId(null)
  }

  const addElement = (type: SlideElement['type']) => {
    const els = currentSlide.elements || []
    const last = els[els.length - 1]
    const newY = last ? Math.min(350, last.y + (last.height || 60) + 20) : 80
    const darkBg = currentSlide.background?.includes('gradient') || currentSlide.background === '#0f172a' || currentSlide.background?.includes('1a1a2e')
    const el: SlideElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'code' ? '// код жазыңыз' : type === 'formula' ? 'E=mc^2' : 'Жаңы текст...',
      x: 40, y: newY,
      width: type === 'code' ? 620 : 440,
      fontSize: 24,
      color: darkBg ? '#ffffff' : '#1f2937',
      align: 'left',
      language: type === 'code' ? 'javascript' : undefined,
    }
    setSlides(prev => {
      const s = [...prev]
      s[currentSlideIndex] = { ...s[currentSlideIndex], elements: [...(s[currentSlideIndex].elements || []), el] }
      return s
    })
    setSelectedElementId(el.id)
  }

  const addSlide = () => {
    const s = [...slides, { title: 'Жаңы слайд', elements: [], background: '#ffffff', titleColor: '#1f2937' }]
    setSlides(s); setCurrentSlideIndex(s.length - 1); setSelectedElementId(null)
  }

  const duplicateSlide = (index: number) => {
    const copy: Slide = JSON.parse(JSON.stringify(slides[index]))
    copy.elements = copy.elements.map(e => ({ ...e, id: Math.random().toString(36).substr(2, 9) }))
    const s = [...slides]; s.splice(index + 1, 0, copy)
    setSlides(s); setCurrentSlideIndex(index + 1)
  }

  const deleteSlide = (index: number) => {
    if (slides.length === 1) return
    const s = slides.filter((_, i) => i !== index)
    setSlides(s); setCurrentSlideIndex(Math.min(index, s.length - 1)); setSelectedElementId(null)
  }

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { updateSlideField(currentSlideIndex, 'backgroundImage', ev.target?.result as string) }
    reader.readAsDataURL(file)
  }

  const handleExport = async (type: 'pptx' | 'pdf' | 'png') => {
    setIsExporting(true)
    try {
      if (type === 'pptx') await exportToPPTX(initialPresentation.title, slides.map(s => ({ title: s.title, content: s.elements.map(e => e.content).join('\n'), image: s.image })))
      else if (type === 'pdf') await exportToPDF('slide-canvas', initialPresentation.title)
      else await exportToImage('slide-canvas', initialPresentation.title)
    } catch (e) { console.error(e) }
    finally { setIsExporting(false) }
  }

  const navSlide = (dir: 1 | -1) => {
    setCurrentSlideIndex(i => Math.max(0, Math.min(slides.length - 1, i + dir)))
    setSelectedElementId(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#e8eaed]">
      <FloatingTextToolbar />

      {/* ── Left: slide panel ──────────────────────────────────────────────── */}
      <div className="w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700 text-sm">Слайддар</h3>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isSaving ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>{isSaving ? 'Сакталууда...' : 'Сакталды'}</span>
            <button onClick={addSlide} className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors"><Plus size={14} /></button>
          </div>
        </div>

        {/* Export */}
        <div className="px-3 py-2.5 border-b border-gray-100 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => handleExport('pptx')} disabled={isExporting} className="text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1.5 rounded-lg font-semibold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all flex items-center justify-center gap-1"><Download size={11} /> PPTX</button>
            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1.5 rounded-lg font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-all flex items-center justify-center gap-1"><Download size={11} /> PDF</button>
          </div>
          <button onClick={() => handleExport('png')} disabled={isExporting} className="w-full text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1.5 rounded-lg font-semibold hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-50 transition-all flex items-center justify-center gap-1"><Download size={11} /> PNG</button>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/presentation/${initialPresentation.id}`); alert('Шилтеме көчүрүлдү!') }} className="w-full text-[11px] bg-indigo-600 text-white px-2 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-1"><Share2 size={11} /> Бөлүшүү</button>
        </div>

        {/* Thumbnails */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {slides.map((slide, i) => (
            <div key={i} onClick={() => { setCurrentSlideIndex(i); setSelectedElementId(null) }}
              className={`group relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${currentSlideIndex === i ? 'border-blue-500 shadow-md shadow-blue-100' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="aspect-video p-2 flex flex-col overflow-hidden" style={buildSlideStyle(slide)}>
                <div className="text-[6px] font-bold truncate leading-tight" style={{ color: slide.titleColor || '#1f2937' }}>{slide.title}</div>
                <div className="flex-1 space-y-0.5 mt-1">
                  {slide.elements.slice(0, 4).map((el, j) => (
                    <div key={j} className="h-[3px] rounded-full opacity-50" style={{ backgroundColor: el.color || '#6b7280', width: `${Math.min(88, 42 + j * 14)}%` }} />
                  ))}
                </div>
              </div>
              <div className={`absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded ${currentSlideIndex === i ? 'bg-blue-500 text-white' : 'bg-black/25 text-white'}`}>{i + 1}</div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={e => { e.stopPropagation(); duplicateSlide(i) }} className="w-5 h-5 bg-white/90 rounded text-gray-600 flex items-center justify-center hover:bg-white shadow-sm"><Copy size={9} /></button>
                {slides.length > 1 && <button onClick={e => { e.stopPropagation(); deleteSlide(i) }} className="w-5 h-5 bg-white/90 rounded text-red-500 flex items-center justify-center hover:bg-white shadow-sm"><Trash size={9} /></button>}
              </div>
            </div>
          ))}
        </div>

        {/* Templates */}
        <div className="px-3 py-2.5 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Layout size={10} /> Калыптар</p>
          <div className="space-y-1">
            {presentationTemplates.map(t => (
              <button key={t.id} onClick={() => {
                const tp = presentationTemplates.find(x => x.id === t.id)
                if (tp && confirm('Слайддар алмаштырылат. Улантасызбы?')) { setSlides(tp.slides as Slide[]); setCurrentSlideIndex(0); setSelectedElementId(null) }
              }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 text-[11px] font-semibold text-gray-600 transition-colors">{t.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: toolbar + canvas ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOOLBAR ── */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-2 shrink-0 shadow-sm overflow-x-auto">

          {selectedElement ? (
            /* ── Element controls ── */
            <>
              {/* Font family */}
              <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-400 shrink-0"
                value={currentSlide?.style?.fontFamily || 'Inter'}
                onChange={e => updateSlideField(currentSlideIndex, 'style', { ...currentSlide?.style, fontFamily: e.target.value })}>
                {FONTS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>

              <div className="w-px h-5 bg-gray-200 shrink-0" />

              {/* Font size */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateElement(selectedElement.id, { fontSize: Math.max(8, (selectedElement.fontSize || 24) - 2) })} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">−</button>
                <span className="w-8 text-center text-xs font-bold text-gray-700">{selectedElement.fontSize || 24}</span>
                <button onClick={() => updateElement(selectedElement.id, { fontSize: Math.min(120, (selectedElement.fontSize || 24) + 2) })} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">+</button>
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

              <div className="ml-auto flex items-center gap-2 shrink-0">
                <div className="text-[10px] text-blue-500 bg-blue-50 px-2 py-1 rounded-lg font-medium">2× = текст өзгөртүү</div>
                <span className="text-xs text-gray-400">{currentSlideIndex + 1}/{slides.length}</span>
              </div>
            </>
          ) : (
            /* ── Slide controls (no element selected) ── */
            <>
              {/* Font */}
              <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-400 shrink-0"
                value={currentSlide?.style?.fontFamily || 'Inter'}
                onChange={e => updateSlideField(currentSlideIndex, 'style', { ...currentSlide?.style, fontFamily: e.target.value })}>
                {FONTS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>

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
                <label className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors shrink-0 relative overflow-hidden" title="Жеке түс">
                  <input type="color" value={currentSlide?.background && !currentSlide.background.includes('gradient') ? currentSlide.background : '#ffffff'} onChange={e => updateSlideField(currentSlideIndex, 'background', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-gray-400 text-[10px] font-bold">+</span>
                </label>
              </div>

              <div className="w-px h-5 bg-gray-200 shrink-0" />

              {/* BG image */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => bgImageInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition-colors">
                  <Image size={12} /> Сурот
                </button>
                {currentSlide?.backgroundImage && (
                  <button onClick={() => updateSlideField(currentSlideIndex, 'backgroundImage', undefined)}
                    className="text-[10px] text-red-400 hover:text-red-600 font-bold px-1" title="Суротту өчүрүү">✕ сурот</button>
                )}
                <input ref={bgImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgImage} />
              </div>

              <div className="w-px h-5 bg-gray-200 shrink-0" />

              {/* Add elements */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => addElement('text')} className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Type size={11} /> Текст</button>
                <button onClick={() => addElement('formula')} className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Sigma size={11} /> Формула</button>
                <button onClick={() => addElement('code')} className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"><Code size={11} /> Код</button>
              </div>

              <div className="ml-auto text-xs font-medium text-gray-400 shrink-0">{currentSlideIndex + 1} / {slides.length}</div>
            </>
          )}
        </div>

        {/* ── CANVAS ── */}
        <div className="flex-1 overflow-y-auto bg-[#e8eaed] flex flex-col items-center justify-center p-6">
          <div className="w-full" style={{ maxWidth: 'min(calc(100% - 48px), 1200px)' }}>

            {/* Navigation row above canvas */}
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

            {/* Slide — strictly aspect-video, no grow */}
            <div
              id="slide-canvas"
              className="w-full rounded-2xl shadow-2xl overflow-hidden"
              style={{ fontFamily: FONTS.find(f => f.name === (currentSlide?.style?.fontFamily || 'Inter'))?.family }}
            >
              <div
                className="aspect-video relative overflow-hidden"
                style={buildSlideStyle(currentSlide)}
                onPointerDown={e => {
                  if (!(e.target as HTMLElement).closest('[data-element]')) setSelectedElementId(null)
                }}
              >
                {/* Title — input (no auto-grow, no height issues) */}
                <input
                  value={currentSlide?.title || ''}
                  onChange={e => updateSlideField(currentSlideIndex, 'title', e.target.value)}
                  placeholder="Аталышы..."
                  className="absolute top-0 left-0 right-0 w-full bg-transparent border-none outline-none font-black px-10 pt-8"
                  style={{
                    fontSize: `${currentSlide?.style?.titleSize || 52}px`,
                    color: currentSlide?.titleColor || '#1f2937',
                    lineHeight: 1.15,
                    zIndex: 10,
                  }}
                />

                {/* Elements */}
                <div className="absolute inset-0 top-[120px]">
                  {currentSlide?.elements?.map(el => (
                    <ElementWrapper
                      key={el.id}
                      element={el}
                      isSelected={selectedElementId === el.id}
                      onSelect={() => setSelectedElementId(el.id)}
                      onUpdate={updates => updateElement(el.id, updates)}
                      onRemove={() => removeElement(el.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
