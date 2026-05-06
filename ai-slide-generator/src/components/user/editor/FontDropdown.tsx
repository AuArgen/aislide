'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { ALL_FONTS, GOOGLE_FONTS, SYSTEM_FONTS } from '@/lib/hooks/useFontManager'

interface Props {
    value: string
    recentFonts: string[]
    onChange: (fontName: string) => void
}

export function FontDropdown({ value, recentFonts, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const buttonRef = useRef<HTMLButtonElement>(null)

    const currentFont = ALL_FONTS.find(f => f.name === value) ?? ALL_FONTS[0]

    const toggle = () => {
        if (!isOpen && buttonRef.current) {
            const r = buttonRef.current.getBoundingClientRect()
            setPos({ top: r.bottom + 4, left: r.left })
        }
        setIsOpen(v => !v)
    }
    const select = (name: string) => { onChange(name); setIsOpen(false) }

    // Reposition on scroll/resize while open
    useEffect(() => {
        if (!isOpen) return
        const update = () => {
            if (buttonRef.current) {
                const r = buttonRef.current.getBoundingClientRect()
                setPos({ top: r.bottom + 4, left: r.left })
            }
        }
        window.addEventListener('scroll', update, true)
        window.addEventListener('resize', update)
        return () => {
            window.removeEventListener('scroll', update, true)
            window.removeEventListener('resize', update)
        }
    }, [isOpen])

    return (
        <div className="relative shrink-0">
            <button
                ref={buttonRef}
                onClick={toggle}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors min-w-[120px]"
                style={{ fontFamily: currentFont.family }}
            >
                <span className="flex-1 text-left truncate max-w-[100px]">{value}</span>
                <ChevronDown size={11} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Full-viewport backdrop — closes dropdown on outside click */}
                    <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />

                    {/* Dropdown panel — rendered at viewport level, never clipped by overflow */}
                    <div
                        className="fixed z-[1000] bg-white border border-gray-200 rounded-xl shadow-2xl w-52 max-h-72 overflow-y-auto custom-scroll"
                        style={{ top: pos.top, left: pos.left }}
                    >
                        {/* Recently used */}
                        {recentFonts.length > 0 && (
                            <div>
                                <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white border-b border-gray-100">
                                    Акыркы колдонулгандар
                                </div>
                                {recentFonts.map(name => {
                                    const f = ALL_FONTS.find(x => x.name === name)
                                    if (!f) return null
                                    return (
                                        <button
                                            key={`recent-${name}`}
                                            onClick={() => select(name)}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2 ${value === name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                                            style={{ fontFamily: f.family }}
                                        >
                                            <span className="text-xs text-blue-400 shrink-0">★</span>
                                            {name}
                                        </button>
                                    )
                                })}
                                <div className="border-t border-gray-100" />
                            </div>
                        )}

                        {/* Google Fonts */}
                        <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white border-b border-gray-100">
                            Google Fonts
                        </div>
                        {GOOGLE_FONTS.map(f => (
                            <button
                                key={f.name}
                                onClick={() => select(f.name)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${value === f.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                                style={{ fontFamily: f.family }}
                            >
                                {f.name}
                            </button>
                        ))}

                        {/* System Fonts */}
                        <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 border-b bg-white">
                            Системалык Шрифтер
                        </div>
                        {SYSTEM_FONTS.map(f => (
                            <button
                                key={f.name}
                                onClick={() => select(f.name)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${value === f.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                                style={{ fontFamily: f.family }}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
