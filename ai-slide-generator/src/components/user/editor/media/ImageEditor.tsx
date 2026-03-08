'use client'

import { useState } from 'react'
import { Loader2, Scissors } from 'lucide-react'
import type { ImageElement, ImageFilter } from '@/types/elements'

interface ImageEditorProps {
  element: ImageElement
  onUpdate: (updates: Partial<ImageElement>) => void
}

const ASPECT_RATIOS: { label: string; ratio: number | null }[] = [
  { label: 'Свободный', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '3:2', ratio: 3 / 2 },
]

const FILTER_FIELDS: { key: keyof ImageFilter; label: string; min: number; max: number; default: number }[] = [
  { key: 'brightness', label: 'Жарыктык', min: 0, max: 200, default: 100 },
  { key: 'contrast', label: 'Контраст', min: 0, max: 200, default: 100 },
  { key: 'saturation', label: 'Каниги', min: 0, max: 200, default: 100 },
  { key: 'blur', label: 'Бүдөмүктүк', min: 0, max: 20, default: 0 },
]

export function ImageEditor({ element, onUpdate }: ImageEditorProps) {
  const [removingBg, setRemovingBg] = useState(false)
  const [bgError, setBgError] = useState<string | null>(null)

  const filters = element.filters ?? { brightness: 100, contrast: 100, saturation: 100, blur: 0 }

  const setFilter = (key: keyof ImageFilter, value: number) => {
    onUpdate({ filters: { ...filters, [key]: value } })
  }

  const applyAspectRatio = (ratio: number | null) => {
    if (!ratio || !element.width) return
    onUpdate({ height: Math.round(element.width / ratio), croppedAspect: undefined })
  }

  const handleRemoveBg = async () => {
    if (!element.src) return
    setBgError(null); setRemovingBg(true)
    try {
      const res = await fetch('/api/bg-remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: element.src }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      onUpdate({ src: json.dataUrl })
    } catch (err: unknown) {
      setBgError((err as Error).message)
    } finally {
      setRemovingBg(false)
    }
  }

  return (
    <div className="w-[200px] shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Сурот • Редактор</h3>
      </div>

      {/* Aspect Ratio Crop */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Scissors size={9} /> Кроп
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {ASPECT_RATIOS.map(ar => (
            <button
              key={ar.label}
              onClick={() => applyAspectRatio(ar.ratio)}
              className="px-2 py-1 rounded-lg border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {ar.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-gray-100 space-y-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Фильтрлер</p>
        {FILTER_FIELDS.map(f => {
          const val = filters[f.key] ?? f.default
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-600 font-medium">{f.label}</span>
                <span className="text-[10px] font-bold text-blue-500">{val}</span>
              </div>
              <input
                type="range" min={f.min} max={f.max} value={val}
                onChange={e => setFilter(f.key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          )
        })}
        <button
          onClick={() => onUpdate({ filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 } })}
          className="w-full text-[10px] text-gray-400 hover:text-gray-600 font-semibold py-1 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Баштапкы абалга кайтаруу
        </button>
      </div>

      {/* Opacity */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ачыктык</span>
          <span className="text-[10px] font-bold text-blue-500">{Math.round((element.opacity ?? 1) * 100)}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={Math.round((element.opacity ?? 1) * 100)}
          onChange={e => onUpdate({ opacity: Number(e.target.value) / 100 })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Border radius */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Тегеректик</span>
          <span className="text-[10px] font-bold text-blue-500">{element.borderRadius ?? 0}px</span>
        </div>
        <input
          type="range" min={0} max={120} value={element.borderRadius ?? 0}
          onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Background removal */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">AI Фон алуу</p>
        <button
          onClick={handleRemoveBg}
          disabled={removingBg}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-[11px] font-bold disabled:opacity-50 transition-all shadow-sm"
        >
          {removingBg ? <Loader2 size={12} className="animate-spin" /> : '✂️'}
          {removingBg ? 'Процессте...' : 'Фонду алуу'}
        </button>
        {bgError && <p className="text-[10px] text-red-500 mt-1 text-center">{bgError}</p>}
      </div>
    </div>
  )
}

/** Build the CSS filter string from an ImageFilter object */
export function buildCssFilter(filters?: ImageFilter): string {
  if (!filters) return ''
  const parts: string[] = []
  if (filters.brightness !== undefined && filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`)
  if (filters.contrast !== undefined && filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`)
  if (filters.saturation !== undefined && filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`)
  if (filters.blur !== undefined && filters.blur !== 0) parts.push(`blur(${filters.blur}px)`)
  return parts.join(' ')
}
