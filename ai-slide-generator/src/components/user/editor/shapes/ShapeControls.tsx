'use client'

import type { ShapeElement, ShapeKind } from '@/types/elements'

const SHAPE_OPTIONS: { kind: ShapeKind; label: string; emoji: string }[] = [
  { kind: 'rect', label: 'Тик бурч', emoji: '▭' },
  { kind: 'circle', label: 'Тегерек', emoji: '⬤' },
  { kind: 'triangle', label: 'Үч бурч', emoji: '▲' },
  { kind: 'diamond', label: 'Ромб', emoji: '◆' },
  { kind: 'star', label: 'Жылдыз', emoji: '★' },
  { kind: 'hexagon', label: 'Алтыбурч', emoji: '⬡' },
  { kind: 'arrow-right', label: 'Жебе →', emoji: '➡' },
  { kind: 'arrow-left', label: 'Жебе ←', emoji: '⬅' },
  { kind: 'line', label: 'Сызык', emoji: '━' },
  { kind: 'speech-bubble', label: 'Сүйлөм', emoji: '💬' },
  { kind: 'cloud', label: 'Булут', emoji: '☁' },
]

interface ShapeControlsProps {
  element: ShapeElement
  onUpdate: (updates: Partial<ShapeElement>) => void
}

export function ShapeControls({ element, onUpdate }: ShapeControlsProps) {
  const isLine = element.shapeKind === 'line'

  return (
    <div className="w-[200px] shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Фигура</h3>
      </div>

      {/* Shape kind */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Тип</p>
        <div className="grid grid-cols-2 gap-1">
          {SHAPE_OPTIONS.map(opt => (
            <button
              key={opt.kind}
              onClick={() => onUpdate({ shapeKind: opt.kind })}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors
                ${element.shapeKind === opt.kind ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fill */}
      {!isLine && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Толтуруу</p>
          {/* Fill type toggle */}
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg mb-2">
            {(['solid', 'gradient'] as const).map(t => (
              <button key={t}
                onClick={() => onUpdate({ fillType: t })}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${element.fillType === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                {t === 'solid' ? 'Бирдиктүү' : 'Градиент'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[10px] text-gray-500">Түс 1</span>
              <div className="relative w-7 h-7">
                <div className="w-full h-full rounded-full border-2 border-gray-200" style={{ backgroundColor: element.fill }} />
                <input type="color" value={element.fill} onChange={e => onUpdate({ fill: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </div>
            </label>
            {element.fillType === 'gradient' && (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[10px] text-gray-500">Түс 2</span>
                <div className="relative w-7 h-7">
                  <div className="w-full h-full rounded-full border-2 border-gray-200" style={{ backgroundColor: element.fillGradientEnd ?? '#a855f7' }} />
                  <input type="color" value={element.fillGradientEnd ?? '#a855f7'} onChange={e => onUpdate({ fillGradientEnd: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
              </label>
            )}
          </div>

          {element.fillType === 'gradient' && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">Бурч</span>
                <span className="text-[10px] font-bold text-blue-500">{element.fillGradientAngle ?? 135}°</span>
              </div>
              <input type="range" min={0} max={360} value={element.fillGradientAngle ?? 135}
                onChange={e => onUpdate({ fillGradientAngle: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none rounded-full accent-blue-500" />
            </div>
          )}
        </div>
      )}

      {/* Stroke */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Чек ара</p>
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-[10px] text-gray-500">Түс</span>
            <div className="relative w-7 h-7">
              <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300" style={{ backgroundColor: element.stroke || 'transparent' }}>
                {!element.stroke && <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-[9px]">∅</span>}
              </div>
              <input type="color" value={element.stroke || '#000000'} onChange={e => onUpdate({ stroke: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </div>
          </label>
          {element.stroke && (
            <button onClick={() => onUpdate({ stroke: undefined })} className="text-[10px] text-red-400 hover:text-red-600 font-bold">✕</button>
          )}
        </div>

        {element.stroke && (
          <>
            {/* Stroke width */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">Калыңдык</span>
                <span className="text-[10px] font-bold text-blue-500">{element.strokeWidth ?? 0}px</span>
              </div>
              <input type="range" min={0} max={20} value={element.strokeWidth ?? 0}
                onChange={e => onUpdate({ strokeWidth: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none rounded-full accent-blue-500" />
            </div>

            {/* Stroke style */}
            <div className="flex gap-1">
              {(['solid', 'dashed', 'dotted'] as const).map(s => (
                <button key={s}
                  onClick={() => onUpdate({ strokeStyle: s })}
                  className={`flex-1 py-1 rounded-lg border text-[10px] font-bold transition-colors
                    ${element.strokeStyle === s ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  {s === 'solid' ? '—' : s === 'dashed' ? '- -' : '···'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Shape-specific controls */}
      {element.shapeKind === 'rect' && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Тегеректик</span>
            <span className="text-[10px] font-bold text-blue-500">{element.borderRadius ?? 0}px</span>
          </div>
          <input type="range" min={0} max={80} value={element.borderRadius ?? 0}
            onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
            className="w-full h-1.5 appearance-none rounded-full accent-blue-500" />
        </div>
      )}

      {(element.shapeKind === 'arrow-right' || element.shapeKind === 'arrow-left') && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Жебе башы</span>
            <span className="text-[10px] font-bold text-blue-500">{element.arrowHeadSize ?? 25}%</span>
          </div>
          <input type="range" min={10} max={60} value={element.arrowHeadSize ?? 25}
            onChange={e => onUpdate({ arrowHeadSize: Number(e.target.value) })}
            className="w-full h-1.5 appearance-none rounded-full accent-blue-500" />
        </div>
      )}

      {/* Text styling */}
      {!isLine && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Текст (2× = өзгөртүү)</p>
          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[10px] text-gray-500">Түс</span>
              <div className="relative w-7 h-7">
                <div className="w-full h-full rounded-full border-2 border-gray-200" style={{ backgroundColor: element.textColor ?? '#fff' }} />
                <input type="color" value={element.textColor ?? '#fff'} onChange={e => onUpdate({ textColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </div>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400">мөлтөм:</span>
              <button onClick={() => onUpdate({ textFontSize: Math.max(8, (element.textFontSize ?? 20) - 2) })}
                className="w-5 h-5 bg-gray-100 rounded text-gray-600 text-xs font-bold hover:bg-gray-200">−</button>
              <span className="text-[10px] font-bold">{element.textFontSize ?? 20}</span>
              <button onClick={() => onUpdate({ textFontSize: Math.min(80, (element.textFontSize ?? 20) + 2) })}
                className="w-5 h-5 bg-gray-100 rounded text-gray-600 text-xs font-bold hover:bg-gray-200">+</button>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onUpdate({ textBold: !element.textBold })}
              className={`w-7 h-7 rounded border text-xs font-black transition-colors ${element.textBold ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              B
            </button>
            <button onClick={() => onUpdate({ textItalic: !element.textItalic })}
              className={`w-7 h-7 rounded border italic text-xs font-semibold transition-colors ${element.textItalic ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              I
            </button>
          </div>
        </div>
      )}

      {/* Opacity */}
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
