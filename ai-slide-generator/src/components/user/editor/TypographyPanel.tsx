'use client'

import { CaseSensitive, CaseUpper, CaseLower } from 'lucide-react'

interface TypographyTarget {
    lineHeight?: number
    letterSpacing?: number
    textShadow?: string
    textStroke?: string
    opacity?: number
    textColumns?: 1 | 2 | 3
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    fontSize?: number
    color?: string
}

interface Props {
    element: TypographyTarget
    onUpdate: (u: Partial<TypographyTarget>) => void
}

// ─── Parse helpers ─────────────────────────────────────────────────────────────

function parseShadow(raw?: string) {
    if (!raw) return { x: 2, y: 2, blur: 4, color: '#000000' }
    const parts = raw.match(/(-?\d+(?:\.\d+)?)px/g) || []
    return {
        x: parseFloat(parts[0] ?? '2'),
        y: parseFloat(parts[1] ?? '2'),
        blur: parseFloat(parts[2] ?? '4'),
        color: raw.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/)?.[0] ?? '#000000',
    }
}

function parseStroke(raw?: string) {
    if (!raw) return { width: 1, color: '#000000' }
    const m = raw.match(/(\d+(?:\.\d+)?)px\s+(#[0-9a-fA-F]{6}|rgba?\([^)]+\))/)
    return { width: parseFloat(m?.[1] ?? '1'), color: m?.[2] ?? '#000000' }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider shrink-0 w-20">{label}</span>
            <div className="flex items-center gap-1 flex-1">{children}</div>
        </div>
    )
}

function Slider({ value, min, max, step = 1, onChange }: {
    value: number; min: number; max: number; step?: number; onChange: (v: number) => void
}) {
    return (
        <input
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="flex-1 accent-blue-500 h-1"
        />
    )
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export function TypographyPanel({ element, onUpdate }: Props) {
    const shadow = parseShadow(element.textShadow)
    const stroke = parseStroke(element.textStroke)

    const setShadow = (patch: Partial<typeof shadow>) => {
        const s = { ...shadow, ...patch }
        onUpdate({ textShadow: `${s.x}px ${s.y}px ${s.blur}px ${s.color}` })
    }

    const setStroke = (patch: Partial<typeof stroke>) => {
        const s = { ...stroke, ...patch }
        onUpdate({ textStroke: `${s.width}px ${s.color}` })
    }

    return (
        <div className="w-[224px] shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-sm overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-700 text-sm">Типография</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Тексттик касиеттер</p>
            </div>

            <div className="p-3 space-y-4">

                {/* ── Opacity ── */}
                <section>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Айкындык</p>
                    <Row label={`${Math.round((element.opacity ?? 1) * 100)}%`}>
                        <Slider
                            value={(element.opacity ?? 1) * 100}
                            min={0} max={100}
                            onChange={v => onUpdate({ opacity: v / 100 })}
                        />
                    </Row>
                </section>

                <div className="border-t border-gray-100" />

                {/* ── Line Height ── */}
                <section>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Саптар аралыгы</p>
                    <Row label={`${(element.lineHeight ?? 1.5).toFixed(1)}×`}>
                        <Slider
                            value={element.lineHeight ?? 1.5}
                            min={0.8} max={3} step={0.1}
                            onChange={v => onUpdate({ lineHeight: v })}
                        />
                    </Row>
                </section>

                {/* ── Letter Spacing ── */}
                <section>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Тамга аралыгы</p>
                    <Row label={`${element.letterSpacing ?? 0}px`}>
                        <Slider
                            value={element.letterSpacing ?? 0}
                            min={-5} max={20} step={0.5}
                            onChange={v => onUpdate({ letterSpacing: v })}
                        />
                    </Row>
                </section>

                <div className="border-t border-gray-100" />

                {/* ── Text Shadow ── */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Текст көлөкөсү</p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onUpdate({ textShadow: element.textShadow ? undefined : '2px 2px 4px #000000' })}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${element.textShadow ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {element.textShadow ? 'Күйүк' : 'Өчүк'}
                            </button>
                        </div>
                    </div>
                    {element.textShadow && (
                        <div className="space-y-2 pl-1">
                            <Row label={`X ${shadow.x}px`}>
                                <Slider value={shadow.x} min={-20} max={20} onChange={v => setShadow({ x: v })} />
                            </Row>
                            <Row label={`Y ${shadow.y}px`}>
                                <Slider value={shadow.y} min={-20} max={20} onChange={v => setShadow({ y: v })} />
                            </Row>
                            <Row label={`Бул ${shadow.blur}px`}>
                                <Slider value={shadow.blur} min={0} max={30} onChange={v => setShadow({ blur: v })} />
                            </Row>
                            <Row label="Түс">
                                <label className="flex-1 flex items-center gap-1.5 cursor-pointer">
                                    <div className="w-6 h-6 rounded border border-gray-300 relative overflow-hidden shrink-0" style={{ backgroundColor: shadow.color }}>
                                        <input type="color" value={shadow.color} onChange={e => setShadow({ color: e.target.value })} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono">{shadow.color}</span>
                                </label>
                            </Row>
                        </div>
                    )}
                </section>

                {/* ── Text Stroke ── */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Текст чегери</p>
                        <button
                            onClick={() => onUpdate({ textStroke: element.textStroke ? undefined : '1px #000000' })}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${element.textStroke ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            {element.textStroke ? 'Күйүк' : 'Өчүк'}
                        </button>
                    </div>
                    {element.textStroke && (
                        <div className="space-y-2 pl-1">
                            <Row label={`Эни ${stroke.width}px`}>
                                <Slider value={stroke.width} min={0.5} max={10} step={0.5} onChange={v => setStroke({ width: v })} />
                            </Row>
                            <Row label="Түс">
                                <label className="flex-1 flex items-center gap-1.5 cursor-pointer">
                                    <div className="w-6 h-6 rounded border border-gray-300 relative overflow-hidden shrink-0" style={{ backgroundColor: stroke.color }}>
                                        <input type="color" value={stroke.color} onChange={e => setStroke({ color: e.target.value })} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono">{stroke.color}</span>
                                </label>
                            </Row>
                        </div>
                    )}
                </section>

                <div className="border-t border-gray-100" />

                {/* ── Text Columns ── */}
                <section>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Тилкелер</p>
                    <div className="flex gap-1.5">
                        {([1, 2, 3] as const).map(n => (
                            <button
                                key={n}
                                onClick={() => onUpdate({ textColumns: n })}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${(element.textColumns ?? 1) === n ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                            >
                                {n === 1 ? '⬜' : n === 2 ? '⬜⬜' : '⬜⬜⬜'}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Text Transform ── */}
                <section>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Регистр</p>
                    <div className="grid grid-cols-4 gap-1">
                        {[
                            { value: 'none', label: 'Ag', title: 'Демейки' },
                            { value: 'uppercase', label: 'AG', title: 'ЧОҢ' },
                            { value: 'lowercase', label: 'ag', title: 'кичи' },
                            { value: 'capitalize', label: 'Ag', title: 'Баш Тамга' },
                        ].map(({ value, label, title }) => (
                            <button
                                key={value}
                                onClick={() => onUpdate({ textTransform: value as any })}
                                title={title}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${(element.textTransform ?? 'none') === value ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                                style={{ textTransform: value === 'none' ? undefined : value as any }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    )
}
