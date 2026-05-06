'use client'
import React, { useEffect, useRef } from 'react'
import {
  Copy, Trash, ArrowUpToLine, ArrowDownToLine, Scissors,
  ClipboardPaste, Undo, Redo, CopyPlus, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
} from 'lucide-react'
import { useT } from '@/components/shared/LanguageProvider'
import type { SlideElement, Slide } from '@/types/elements'
import { isText, isShape, isImage } from '@/types/elements'

const TEXT_COLORS = [
  '#000000', '#374151', '#6B7280', '#ffffff',
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

const SHAPE_FILLS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#0F172A', '#374151',
  '#6B7280', '#ffffff', '#F3F4F6', '#000000',
]

const BG_PRESETS = [
  { label: 'White', value: '#ffffff', type: 'solid' },
  { label: 'Light', value: '#f8fafc', type: 'solid' },
  { label: 'Dark', value: '#0f172a', type: 'solid' },
  { label: 'Blue', value: '#1e40af', type: 'solid' },
  { label: 'Green', value: '#065f46', type: 'solid' },
  { label: 'Purple', value: '#4c1d95', type: 'solid' },
  { label: 'Red', value: '#7f1d1d', type: 'solid' },
  { label: 'Ocean', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', type: 'gradient' },
  { label: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', type: 'gradient' },
  { label: 'Gold', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', type: 'gradient' },
]

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onAction: (action: string, data?: any) => void
  hasSelection: boolean
  hasClipboard: boolean
  canUndo: boolean
  canRedo: boolean
  selectedElement?: SlideElement | null
  currentSlide?: Slide | null
}

export function ContextMenu({
  x, y, onClose, onAction,
  hasSelection, hasClipboard, canUndo, canRedo,
  selectedElement, currentSlide,
}: ContextMenuProps) {
  const t = useT()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [onClose])

  // Adjust position to stay within viewport
  const menuW = 224
  const adjustedX = x + menuW > window.innerWidth ? x - menuW : x
  const adjustedY = y + 520 > window.innerHeight ? Math.max(0, window.innerHeight - 520) : y

  const style: React.CSSProperties = {
    top: adjustedY,
    left: adjustedX,
    position: 'fixed',
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const textEl = selectedElement && isText(selectedElement) ? selectedElement : null
  const shapeEl = selectedElement && isShape(selectedElement) ? selectedElement : null
  const imageEl = selectedElement && isImage(selectedElement) ? selectedElement : null

  return (
    <div
      ref={menuRef}
      className="z-[9999] bg-white border border-gray-200 shadow-xl rounded-lg py-1.5 w-56 text-sm font-medium text-gray-700 select-none"
      style={style}
      onContextMenu={handleContextMenu}
    >
      {/* ── TEXT element section ──────────────────────────────── */}
      {textEl && (
        <>
          {/* Font size */}
          <div className="px-3 pt-2 pb-1">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              {t('editor.ctxFontSize')}
            </div>
            <div className="flex gap-1 flex-wrap">
              {[18, 24, 32, 48, 64, 96].map(size => (
                <button
                  key={size}
                  onClick={() => { onAction('text-size', { size }); onClose() }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                    textEl.fontSize === size
                      ? 'bg-blue-100 border-blue-400 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Style toggles + alignment */}
          <div className="px-3 py-1 flex items-center gap-1.5">
            <button
              title={t('editor.ctxBold')}
              onClick={() => { onAction('text-bold'); onClose() }}
              className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                textEl.fontWeight === 'bold'
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Bold size={13} />
            </button>
            <button
              title={t('editor.ctxItalic')}
              onClick={() => { onAction('text-italic'); onClose() }}
              className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                textEl.fontStyle === 'italic'
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Italic size={13} />
            </button>
            <button
              title={t('editor.ctxUnderline')}
              onClick={() => { onAction('text-underline'); onClose() }}
              className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                textEl.textDecoration === 'underline'
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Underline size={13} />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button
              title={t('editor.ctxAlignLeft')}
              onClick={() => { onAction('text-align', { align: 'left' }); onClose() }}
              className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                textEl.align === 'left' || !textEl.align
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <AlignLeft size={13} />
            </button>
            <button
              title={t('editor.ctxAlignCenter')}
              onClick={() => { onAction('text-align', { align: 'center' }); onClose() }}
              className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                textEl.align === 'center'
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <AlignCenter size={13} />
            </button>
            <button
              title={t('editor.ctxAlignRight')}
              onClick={() => { onAction('text-align', { align: 'right' }); onClose() }}
              className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${
                textEl.align === 'right'
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <AlignRight size={13} />
            </button>
          </div>

          {/* Text color swatches */}
          <div className="px-3 pb-2">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              {t('editor.ctxTextColor')}
            </div>
            <div className="flex flex-wrap gap-1">
              {TEXT_COLORS.map(c => (
                <button
                  key={c}
                  title={c}
                  onClick={() => { onAction('text-color', { color: c }); onClose() }}
                  className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${
                    textEl.color === c ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="h-px bg-gray-200 my-1 mx-2" />
        </>
      )}

      {/* ── SHAPE element section ─────────────────────────────── */}
      {shapeEl && (
        <>
          <div className="px-3 pt-2 pb-2">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              {t('editor.ctxFillColor')}
            </div>
            <div className="flex flex-wrap gap-1">
              {SHAPE_FILLS.map(c => (
                <button
                  key={c}
                  title={c}
                  onClick={() => { onAction('shape-fill', { color: c }); onClose() }}
                  className={`w-5 h-5 rounded border-2 hover:scale-110 transition-transform ${
                    shapeEl.fill === c ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="h-px bg-gray-200 my-1 mx-2" />
        </>
      )}

      {/* ── IMAGE element section ─────────────────────────────── */}
      {imageEl && (
        <>
          <ContextMenuItem
            icon={<ImageIcon size={14} />}
            label={t('editor.ctxReplaceImage')}
            onClick={() => { onAction('replace-image'); onClose() }}
          />
          <div className="h-px bg-gray-200 my-1 mx-2" />
        </>
      )}

      {/* ── Background section (nothing selected) ────────────── */}
      {!selectedElement && currentSlide && (
        <>
          <div className="px-3 pt-2 pb-2">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              {t('editor.ctxBgColor')}
            </div>
            <div className="flex flex-wrap gap-1">
              {BG_PRESETS.map(p => (
                <button
                  key={p.value}
                  title={p.label}
                  onClick={() => { onAction('bg-color', { value: p.value, type: p.type }); onClose() }}
                  className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform"
                  style={
                    p.type === 'gradient'
                      ? { backgroundImage: p.value }
                      : { backgroundColor: p.value }
                  }
                />
              ))}
            </div>
          </div>
          <div className="h-px bg-gray-200 my-1 mx-2" />
        </>
      )}

      {/* ── Generic section ───────────────────────────────────── */}
      <ContextMenuItem
        icon={<Undo size={14} />}
        label={t('editor.ctxUndo')}
        shortcut="Ctrl+Z"
        onClick={() => { onAction('undo'); onClose() }}
        disabled={!canUndo}
      />
      <ContextMenuItem
        icon={<Redo size={14} />}
        label={t('editor.ctxRedo')}
        shortcut="Ctrl+Y"
        onClick={() => { onAction('redo'); onClose() }}
        disabled={!canRedo}
      />
      <div className="h-px bg-gray-200 my-1 mx-2" />
      <ContextMenuItem
        icon={<Scissors size={14} />}
        label={t('editor.ctxCut')}
        shortcut="Ctrl+X"
        onClick={() => { onAction('cut'); onClose() }}
        disabled={!hasSelection}
      />
      <ContextMenuItem
        icon={<Copy size={14} />}
        label={t('editor.ctxCopy')}
        shortcut="Ctrl+C"
        onClick={() => { onAction('copy'); onClose() }}
        disabled={!hasSelection}
      />
      <ContextMenuItem
        icon={<ClipboardPaste size={14} />}
        label={t('editor.ctxPaste')}
        shortcut="Ctrl+V"
        onClick={() => { onAction('paste'); onClose() }}
        disabled={!hasClipboard}
      />
      <ContextMenuItem
        icon={<CopyPlus size={14} />}
        label={t('editor.ctxDuplicate')}
        shortcut="Ctrl+D"
        onClick={() => { onAction('duplicate'); onClose() }}
        disabled={!hasSelection}
      />
      <div className="h-px bg-gray-200 my-1 mx-2" />
      <ContextMenuItem
        icon={<ArrowUpToLine size={14} />}
        label={t('editor.ctxBringForward')}
        onClick={() => { onAction('bringForward'); onClose() }}
        disabled={!hasSelection}
      />
      <ContextMenuItem
        icon={<ArrowDownToLine size={14} />}
        label={t('editor.ctxSendBackward')}
        onClick={() => { onAction('sendBackward'); onClose() }}
        disabled={!hasSelection}
      />
      <div className="h-px bg-gray-200 my-1 mx-2" />
      <ContextMenuItem
        icon={<Trash size={14} />}
        label={t('editor.ctxDelete')}
        shortcut="Del"
        onClick={() => { onAction('delete'); onClose() }}
        disabled={!hasSelection}
        danger
      />
    </div>
  )
}

function ContextMenuItem({
  icon, label, shortcut, onClick, disabled = false, danger = false,
}: {
  icon: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={() => { if (!disabled) onClick() }}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-4 py-1.5 text-left transition-colors
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}
        ${danger && !disabled ? 'text-red-600 hover:bg-red-50' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
    </button>
  )
}
