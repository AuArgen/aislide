'use client'

import { useState, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import { Search, X } from 'lucide-react'
import type { IconElement } from '@/types/elements'

// Build a list of all icon names from lucide-react
const ALL_ICON_NAMES = Object.keys(LucideIcons).filter(name => {
  const comp = (LucideIcons as Record<string, unknown>)[name]
  return typeof comp === 'function' && name !== 'createLucideIcon' && /^[A-Z]/.test(name)
})

interface IconPickerProps {
  onInsert: (iconName: string, color: string) => void
  onClose: () => void
}

export function IconPicker({ onInsert, onClose }: IconPickerProps) {
  const [query, setQuery] = useState('')
  const [selectedColor, setSelectedColor] = useState('#6366f1')

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_ICON_NAMES.slice(0, 120)
    const q = query.toLowerCase()
    return ALL_ICON_NAMES.filter(n => n.toLowerCase().includes(q)).slice(0, 120)
  }, [query])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-[560px] max-h-[70vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Белги издеңиз... (star, arrow, check...)"
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {/* Color picker */}
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <span className="text-xs text-gray-500 font-medium">Түс</span>
            <div className="relative w-8 h-8">
              <div className="w-full h-full rounded-full border-2 border-gray-200 shadow-sm" style={{ backgroundColor: selectedColor }} />
              <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
          </label>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-8 gap-2">
            {filtered.map(iconName => {
              const Icon = (LucideIcons as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[iconName]
              if (!Icon) return null
              return (
                <button
                  key={iconName}
                  onClick={() => { onInsert(iconName, selectedColor); onClose() }}
                  title={iconName}
                  className="group flex flex-col items-center justify-center w-12 h-12 rounded-xl border border-transparent hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <Icon size={22} color={selectedColor} strokeWidth={2} />
                </button>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
              <p className="text-sm">Белги табылган жок</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">{filtered.length} белги табылды • Lucide React</p>
        </div>
      </div>
    </div>
  )
}

// ─── Inline Icon Renderer ─────────────────────────────────────────────────────
interface IconRendererProps {
  element: IconElement
}

export function IconRenderer({ element }: IconRendererProps) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{
    size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties
  }>>)[element.iconName]

  if (!Icon) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
        ?{element.iconName}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ opacity: element.opacity ?? 1 }}>
      <Icon
        size={element.size ?? 64}
        color={element.color}
        strokeWidth={element.strokeWidth ?? 2}
        style={{ transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined }}
      />
    </div>
  )
}

// ─── Icon Controls (right panel) ─────────────────────────────────────────────
interface IconControlsProps {
  element: IconElement
  onUpdate: (updates: Partial<IconElement>) => void
  onOpenPicker: () => void
}

export function IconControls({ element, onUpdate, onOpenPicker }: IconControlsProps) {
  return (
    <div className="w-[200px] shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Белги</h3>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <button onClick={onOpenPicker}
          className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors">
          🔄 Белгини которуу
        </button>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Түс</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative w-8 h-8">
            <div className="w-full h-full rounded-full border-2 border-gray-200" style={{ backgroundColor: element.color }} />
            <input type="color" value={element.color} onChange={e => onUpdate({ color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </div>
          <span className="text-xs text-gray-600 font-medium">{element.color}</span>
        </label>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Чек ара кеңдиги</span>
          <span className="text-[10px] font-bold text-blue-500">{element.strokeWidth ?? 2}</span>
        </div>
        <input type="range" min={0.5} max={4} step={0.5} value={element.strokeWidth ?? 2}
          onChange={e => onUpdate({ strokeWidth: Number(e.target.value) })}
          className="w-full h-1.5 appearance-none rounded-full accent-blue-500" />
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ачыктык</span>
          <span className="text-[10px] font-bold text-blue-500">{Math.round((element.opacity ?? 1) * 100)}%</span>
        </div>
        <input type="range" min={5} max={100} value={Math.round((element.opacity ?? 1) * 100)}
          onChange={e => onUpdate({ opacity: Number(e.target.value) / 100 })}
          className="w-full h-1.5 appearance-none rounded-full accent-blue-500" />
      </div>
    </div>
  )
}
