'use client'
/**
 * AlignmentToolbar.tsx
 * Shown in the top toolbar when 2 or more elements are selected.
 * Provides 6 alignment actions and 2 distribution actions (3+ required).
 */

import React from 'react'
import {
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
} from 'lucide-react'
import { alignElements, distributeElements, AlignDir } from '@/lib/editor/alignDistribute'
import type { SlideElement } from '@/types/elements'

interface AlignmentToolbarProps {
  elements: SlideElement[]
  selectedIds: string[]
  onUpdateElements: (elements: SlideElement[]) => void
}

interface ActionBtn {
  icon: React.ElementType
  label: string
  fn: () => void
  disabled?: boolean
}

export function AlignmentToolbar({
  elements,
  selectedIds,
  onUpdateElements,
}: AlignmentToolbarProps) {
  if (selectedIds.length < 2) return null

  const canDistribute = selectedIds.length >= 3

  const align = (dir: AlignDir) => onUpdateElements(alignElements(elements, selectedIds, dir))
  const dist  = (axis: 'x' | 'y') => onUpdateElements(distributeElements(elements, selectedIds, axis))

  const actions: ActionBtn[] = [
    { icon: AlignStartVertical,          label: 'Солго тегиздөө',    fn: () => align('left') },
    { icon: AlignCenterVertical,         label: 'Борборго (тик)',     fn: () => align('centerH') },
    { icon: AlignEndVertical,            label: 'Оңго тегиздөө',     fn: () => align('right') },
    { icon: AlignStartHorizontal,        label: 'Жогоруга тегиздөө', fn: () => align('top') },
    { icon: AlignCenterHorizontal,       label: 'Борборго (туурасынан)', fn: () => align('centerV') },
    { icon: AlignEndHorizontal,          label: 'Ылдыга тегиздөө',   fn: () => align('bottom') },
    { icon: AlignHorizontalDistributeCenter, label: 'Туурасынан бөлүштүрүү', fn: () => dist('x'), disabled: !canDistribute },
    { icon: AlignVerticalDistributeCenter,   label: 'Тик бөлүштүрүү',       fn: () => dist('y'), disabled: !canDistribute },
  ]

  return (
    <>
      <div className="w-px h-5 bg-gray-200 shrink-0" />
      <div className="flex items-center gap-0.5 shrink-0">
        {actions.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.fn}
            disabled={btn.disabled}
            title={btn.label}
            className="w-8 h-8 rounded flex items-center justify-center text-gray-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <btn.icon size={14} />
          </button>
        ))}
      </div>
    </>
  )
}
