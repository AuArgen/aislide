/**
 * ThemePanel.tsx
 * Global theme editor — preset color schemes + per-token color/typography overrides.
 * Injects CSS custom properties on the #slide-canvas element for live theme binding.
 */
'use client'

import { useEffect } from 'react'
import { useThemeStore, THEME_PRESETS } from '@/store/themeStore'
import type { ThemeColors } from '@/store/themeStore'
import { ALL_FONTS } from '@/lib/hooks/useFontManager'

// ─── CSS variable injection ────────────────────────────────────────────────────

function injectThemeVars(colors: ThemeColors) {
  const root = document.getElementById('slide-canvas')
  if (!root) return
  root.style.setProperty('--theme-primary',    colors.primary)
  root.style.setProperty('--theme-secondary',  colors.secondary)
  root.style.setProperty('--theme-text',       colors.text)
  root.style.setProperty('--theme-background', colors.background)
  root.style.setProperty('--theme-accent',     colors.accent)
}

// ─── Component ────────────────────────────────────────────────────────────────

const COLOR_TOKENS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'primary',    label: 'Негизги' },
  { key: 'secondary',  label: 'Кошумча' },
  { key: 'text',       label: 'Текст' },
  { key: 'background', label: 'Фон' },
  { key: 'accent',     label: 'Акцент' },
]

export function ThemePanel() {
  const { activeTheme, setTheme, updateColor, updateTypography } = useThemeStore()

  // Inject CSS vars whenever theme changes
  useEffect(() => {
    injectThemeVars(activeTheme.colors)
  }, [activeTheme])

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 space-y-4">

        {/* ── Preset cards ── */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Стиль теманы</p>
          <div className="grid grid-cols-2 gap-1.5">
            {THEME_PRESETS.map(preset => {
              const isActive = preset.id === activeTheme.id
              return (
                <button
                  key={preset.id}
                  onClick={() => setTheme(preset)}
                  className={`p-2 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-95 text-left
                    ${isActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`}
                >
                  {/* Color chips preview */}
                  <div className="flex gap-1 mb-1.5">
                    {[preset.colors.primary, preset.colors.secondary, preset.colors.text, preset.colors.background, preset.colors.accent].map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className={`text-[11px] font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {preset.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Color tokens ── */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Түстөр</p>
          <div className="space-y-2">
            {COLOR_TOKENS.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-[11px] font-medium text-gray-600">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-mono">{activeTheme.colors[key]}</span>
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-indigo-400 transition-colors">
                    <div className="w-full h-full" style={{ backgroundColor: activeTheme.colors[key] }} />
                    <input
                      type="color"
                      value={activeTheme.colors[key]}
                      onChange={e => updateColor(key, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Typography ── */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Тамгалар</p>
          <div className="space-y-2">
            {([
              { key: 'headingFont' as const, label: 'Аталыш' },
              { key: 'bodyFont' as const,    label: 'Текст' },
            ]).map(({ key, label }) => (
              <div key={key} className="space-y-0.5">
                <span className="text-[10px] text-gray-500">{label}</span>
                <select
                  value={activeTheme.typography[key]}
                  onChange={e => updateTypography(key, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-700 outline-none focus:border-indigo-400 bg-white"
                >
                  {ALL_FONTS.map(f => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live preview strip ── */}
        <div
          className="rounded-xl p-3 space-y-1 border border-gray-200"
          style={{ backgroundColor: activeTheme.colors.background }}
        >
          <p style={{ color: activeTheme.colors.primary, fontFamily: activeTheme.typography.headingFont }} className="text-sm font-bold">
            Аталыш мисалы
          </p>
          <p style={{ color: activeTheme.colors.text, fontFamily: activeTheme.typography.bodyFont }} className="text-[11px]">
            Текст мисалы — презентация мазмуну.
          </p>
          <span
            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: activeTheme.colors.accent, color: '#fff' }}
          >
            Акцент
          </span>
        </div>
      </div>
    </div>
  )
}
