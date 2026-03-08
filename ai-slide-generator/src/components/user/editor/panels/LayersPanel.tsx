'use client'
/**
 * LayersPanel.tsx
 * Right-sidebar panel listing all elements in reverse z-order (front to back).
 * Per-element: visibility toggle, lock toggle, click to select, drag to reorder.
 */

import React from 'react'
import {
  Eye, EyeOff, Lock, Unlock, Layers,
  MoveUp, MoveDown, ChevronsUp, ChevronsDown,
  Group, Ungroup,
} from 'lucide-react'
import type { SlideElement } from '@/types/elements'
import { isGroup } from '@/types/elements'
import {
  bringToFront, sendToBack, bringForward, sendBackward,
} from '@/lib/editor/layerActions'
import { groupElements, ungroupElements } from '@/lib/editor/groupActions'

interface LayersPanelProps {
  elements: SlideElement[]
  selectedIds: string[]
  onSelectIds: (ids: string[]) => void
  onUpdateElements: (elements: SlideElement[]) => void
}

function layerLabel(el: SlideElement): string {
  switch (el.type) {
    case 'text':    return ('content' in el ? (el as {content: string}).content.replace(/<[^>]*>/g, '').slice(0, 20) || 'Текст' : 'Текст')
    case 'image':   return 'Сурот'
    case 'shape':   return 'Фигура'
    case 'icon':    return `Белги: ${'iconName' in el ? (el as {iconName: string}).iconName : ''}`
    case 'formula': return 'Формула'
    case 'code':    return 'Код'
    case 'video':   return 'Видео'
    case 'group':   return `Группа (${(el as {childIds: string[]}).childIds.length})`
    default:        return 'Элемент'
  }
}

function layerIcon(el: SlideElement): string {
  const icons: Record<string, string> = {
    text: 'T', image: '🖼', shape: '⬛', icon: '⭐', formula: 'Σ', code: '</>', video: '▶', group: '⊞',
  }
  return icons[el.type] ?? '?'
}

export function LayersPanel({
  elements,
  selectedIds,
  onSelectIds,
  onUpdateElements,
}: LayersPanelProps) {
  // Reverse to show front-most layers first
  const reversed = [...elements].reverse()
  const singleId = selectedIds.length === 1 ? selectedIds[0] : null
  const canGroup = selectedIds.length >= 2
  const selectedGroup = singleId ? elements.find(e => e.id === singleId && isGroup(e)) : null

  return (
    <div className="w-[220px] shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Layers size={14} className="text-gray-500" />
        <h3 className="font-bold text-gray-700 text-sm">Катмарлар</h3>
      </div>

      {/* Group / Ungroup */}
      <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5">
        <button
          disabled={!canGroup}
          onClick={() => {
            const newEls = groupElements(elements, selectedIds)
            onUpdateElements(newEls)
            // Select the newly created group (last element with type=group)
            const grp = [...newEls].reverse().find(e => e.type === 'group')
            if (grp) onSelectIds([grp.id])
          }}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Группалоо (2+ тандалган)"
        >
          <Group size={11} /> Группа
        </button>
        <button
          disabled={!selectedGroup}
          onClick={() => {
            if (!singleId) return
            const { elements: newEls, childIds } = ungroupElements(elements, singleId)
            onUpdateElements(newEls)
            onSelectIds(childIds)
          }}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Группаны ажыратуу"
        >
          <Ungroup size={11} /> Ажырат
        </button>
      </div>

      {/* Layer ordering buttons */}
      {singleId && (
        <div className="px-3 py-2 border-b border-gray-100 flex gap-1">
          {([
            { icon: ChevronsUp,   label: 'Алдыңкы',  fn: () => onUpdateElements(bringToFront(elements, singleId)) },
            { icon: MoveUp,       label: 'Бир алга',  fn: () => onUpdateElements(bringForward(elements, singleId)) },
            { icon: MoveDown,     label: 'Бир артка', fn: () => onUpdateElements(sendBackward(elements, singleId)) },
            { icon: ChevronsDown, label: 'Аркы',      fn: () => onUpdateElements(sendToBack(elements, singleId)) },
          ] as Array<{icon: React.ElementType; label: string; fn: () => void}>).map((btn) => (
            <button
              key={btn.label}
              onClick={btn.fn}
              title={btn.label}
              className="flex-1 flex items-center justify-center p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <btn.icon size={13} />
            </button>
          ))}
        </div>
      )}

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {reversed.map((el) => {
          const isSelected = selectedIds.includes(el.id)
          const isHidden = el.visible === false
          const isLocked = !!el.locked

          return (
            <div
              key={el.id}
              onClick={e => {
                if (e.shiftKey) {
                  onSelectIds(
                    isSelected
                      ? selectedIds.filter(id => id !== el.id)
                      : [...selectedIds, el.id]
                  )
                } else {
                  onSelectIds([el.id])
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-50 text-[12px] transition-colors ${
                isSelected
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-700'
              } ${isHidden ? 'opacity-40' : ''}`}
            >
              {/* Type icon */}
              <span className="text-[11px] font-mono w-5 text-center shrink-0 text-gray-400">
                {layerIcon(el)}
              </span>

              {/* Label */}
              <span className="flex-1 truncate font-medium">{layerLabel(el)}</span>

              {/* Controls */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  const updated = elements.map(x =>
                    x.id === el.id ? { ...x, visible: x.visible !== false ? false : undefined } : x
                  )
                  onUpdateElements(updated)
                }}
                className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                title={isHidden ? 'Көрсөт' : 'Жашыр'}
              >
                {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
              <button
                onClick={e => {
                  e.stopPropagation()
                  const updated = elements.map(x =>
                    x.id === el.id ? { ...x, locked: !x.locked } : x
                  )
                  onUpdateElements(updated)
                }}
                className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                title={isLocked ? 'Кулпуну ач' : 'Кулпула'}
              >
                {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
            </div>
          )
        })}

        {elements.length === 0 && (
          <p className="text-center text-gray-400 text-xs py-8">
            Элементтер жок
          </p>
        )}
      </div>
    </div>
  )
}
