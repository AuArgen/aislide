/**
 * BackgroundPanel.tsx
 * Sidebar panel for managing the active slide's background.
 * Three tabs: Solid color | Gradient | Image URL / upload.
 * "Apply to All" propagates the current background to every slide.
 */
'use client'

import { useState, useRef } from 'react'
import { useSlidesStore } from '@/store/slidesStore'
import type { SlideBackground } from '@/types/elements'
import { Layers, Image, Droplets } from 'lucide-react'

// ─── Presets ──────────────────────────────────────────────────────────────────

const SOLID_PRESETS = [
  '#ffffff', '#f8fafc', '#0f172a', '#1e1b4b',
  '#1f2937', '#ecfdf5', '#fef3c7', '#fce7f3',
  '#dbeafe', '#f0fdf4', '#fff7ed', '#f5f3ff',
]

const GRADIENT_PRESETS = [
  { label: 'Индиго',   value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Жашыл',   value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { label: 'Закат',   value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Океан',   value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Алтын',   value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { label: 'Күн',     value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: 'Түн',     value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  { label: 'Атмос.', value: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
  { label: 'Кызгылт', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { label: 'Таң',     value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
]

type TabId = 'solid' | 'gradient' | 'image'

// ─── Component ────────────────────────────────────────────────────────────────

export function BackgroundPanel() {
  const { slides, activeSlideId, setSlideBackground, applyBackgroundToAll } = useSlidesStore()
  const activeSlide = slides.find(s => s.id === activeSlideId)

  const existingBg = activeSlide?.bg
  const [activeTab, setActiveTab] = useState<TabId>(existingBg?.type ?? 'solid')

  // Image tab state
  const [imageUrl, setImageUrl] = useState(
    existingBg?.type === 'image' ? existingBg.value : ''
  )
  const [overlayColor, setOverlayColor] = useState(existingBg?.overlayColor ?? '#000000')
  const [overlayOpacity, setOverlayOpacity] = useState(existingBg?.overlayOpacity ?? 0)
  const fileRef = useRef<HTMLInputElement>(null)

  // Gradient tab state
  const [gradientAngle, setGradientAngle] = useState(135)
  const [customGradFrom, setCustomGradFrom] = useState('#667eea')
  const [customGradTo, setCustomGradTo] = useState('#764ba2')

  const applyBg = (bg: SlideBackground) => {
    if (!activeSlideId) return
    setSlideBackground(activeSlideId, bg)
  }

  const buildCustomGradient = () =>
    `linear-gradient(${gradientAngle}deg, ${customGradFrom} 0%, ${customGradTo} 100%)`

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setImageUrl(url)
      applyBg({ type: 'image', value: url, overlayColor, overlayOpacity })
    }
    reader.readAsDataURL(file)
  }

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'solid',    label: 'Бирдиктүү', icon: <Droplets size={13} /> },
    { id: 'gradient', label: 'Градиент',  icon: <Layers size={13} /> },
    { id: 'image',    label: 'Сурот',     icon: <Image size={13} /> },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 shrink-0 px-1 pt-1 gap-0.5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold rounded-t-lg transition-colors
              ${activeTab === t.id
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* ── Solid ── */}
        {activeTab === 'solid' && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Түс тандоо</p>
            <div className="grid grid-cols-6 gap-1.5">
              {SOLID_PRESETS.map(hex => (
                <button
                  key={hex}
                  onClick={() => applyBg({ type: 'solid', value: hex })}
                  className="w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: hex,
                    borderColor: activeSlide?.bg?.value === hex ? '#6366f1' : '#e5e7eb',
                    boxShadow: hex === '#ffffff' ? 'inset 0 0 0 1px #e5e7eb' : undefined,
                  }}
                />
              ))}
            </div>
            {/* Custom color */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[11px] font-medium text-gray-600">Башка түс:</span>
              <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-gray-300 group-hover:border-indigo-400 transition-colors overflow-hidden">
                <div className="w-full h-full" style={{ backgroundColor: activeSlide?.bg?.type === 'solid' ? activeSlide.bg.value : '#ffffff' }} />
                <input
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={activeSlide?.bg?.type === 'solid' ? activeSlide.bg.value : '#ffffff'}
                  onChange={e => applyBg({ type: 'solid', value: e.target.value })}
                />
              </div>
            </label>
          </div>
        )}

        {/* ── Gradient ── */}
        {activeTab === 'gradient' && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Даяр градиенттер</p>
            <div className="grid grid-cols-2 gap-1.5">
              {GRADIENT_PRESETS.map(g => (
                <button
                  key={g.value}
                  onClick={() => applyBg({ type: 'gradient', value: g.value })}
                  className="h-12 rounded-xl border-2 text-[10px] font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: g.value,
                    borderColor: activeSlide?.bg?.value === g.value ? '#1d4ed8' : 'transparent',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Өз градиентиңиз</p>
              <div className="flex gap-2">
                <label className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">Башы</span>
                  <div className="relative w-full h-8 rounded-lg overflow-hidden border border-gray-200">
                    <div className="w-full h-full" style={{ backgroundColor: customGradFrom }} />
                    <input type="color" value={customGradFrom}
                      onChange={e => setCustomGradFrom(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                </label>
                <label className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">Аягы</span>
                  <div className="relative w-full h-8 rounded-lg overflow-hidden border border-gray-200">
                    <div className="w-full h-full" style={{ backgroundColor: customGradTo }} />
                    <input type="color" value={customGradTo}
                      onChange={e => setCustomGradTo(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                </label>
              </div>
              {/* Angle slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Бурч ({gradientAngle}°)</span>
                </div>
                <input type="range" min={0} max={360} step={15}
                  value={gradientAngle}
                  onChange={e => setGradientAngle(Number(e.target.value))}
                  className="w-full accent-indigo-500" />
              </div>
              {/* Preview */}
              <div className="h-10 rounded-lg border border-gray-200" style={{ background: buildCustomGradient() }} />
              <button
                onClick={() => applyBg({ type: 'gradient', value: buildCustomGradient() })}
                className="w-full py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-semibold rounded-lg transition-colors"
              >
                Колдонуу
              </button>
            </div>
          </div>
        )}

        {/* ── Image ── */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Сурот фону</p>

            {/* Preview */}
            {imageUrl && (
              <div className="relative w-full h-20 rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
              </div>
            )}

            {/* URL input */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-medium">Сурот URL дареги:</span>
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                onBlur={() => {
                  if (imageUrl) applyBg({ type: 'image', value: imageUrl, overlayColor, overlayOpacity })
                }}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* File upload */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl text-[11px] font-medium text-gray-500 hover:text-indigo-500 transition-colors"
            >
              <Image size={12} /> Файлдан жүктөө
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

            {/* Overlay controls */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Каптоо реңки</p>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  <div className="w-full h-full" style={{ backgroundColor: overlayColor }} />
                  <input type="color" value={overlayColor}
                    onChange={e => {
                      setOverlayColor(e.target.value)
                      if (imageUrl) applyBg({ type: 'image', value: imageUrl, overlayColor: e.target.value, overlayOpacity })
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-gray-500">Ачыктык</span>
                    <span className="text-[10px] font-bold text-gray-600">{Math.round(overlayOpacity * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05}
                    value={overlayOpacity}
                    onChange={e => {
                      const v = Number(e.target.value)
                      setOverlayOpacity(v)
                      if (imageUrl) applyBg({ type: 'image', value: imageUrl, overlayColor, overlayOpacity: v })
                    }}
                    className="w-full accent-indigo-500" />
                </div>
              </div>
            </div>

            {imageUrl && (
              <button
                onClick={() => {
                  setImageUrl('')
                  if (activeSlideId) setSlideBackground(activeSlideId, { type: 'solid', value: '#ffffff' })
                }}
                className="w-full py-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-[11px] font-medium rounded-lg transition-colors"
              >
                ✕ Суротту алып салуу
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Apply to All ── */}
      <div className="shrink-0 p-3 border-t border-gray-100">
        <button
          onClick={() => {
            const bg = activeSlide?.bg
            if (!bg) return
            applyBackgroundToAll(bg)
          }}
          className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          ✦ Баардык слайдга колдонуу
        </button>
      </div>
    </div>
  )
}
