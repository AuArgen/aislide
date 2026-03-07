'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bold, Italic, Underline, Strikethrough, Link, Wand2, Highlighter, X, Loader2 } from 'lucide-react'
import { textAiAction } from '@/lib/actions/gemini'

const TEXT_PALETTE = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
]

const HIGHLIGHT_PALETTE = [
    '#fef08a', '#bbf7d0', '#bfdbfe', '#fde68a', '#fbcfe8',
    '#e9d5ff', '#fed7aa', '#f1f5f9', 'transparent',
]

type AIMode = 'summarize' | 'expand' | 'grammar' | 'rewrite'

const AI_MODES: { id: AIMode; label: string; icon: string }[] = [
    { id: 'grammar', label: 'Грамматика', icon: '✓' },
    { id: 'rewrite', label: 'Кайра жаз', icon: '↺' },
    { id: 'summarize', label: 'Кыскарт', icon: '↓' },
    { id: 'expand', label: 'Кеңейт', icon: '↑' },
]

export function FloatingTextToolbar() {
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
    const [showLinkForm, setShowLinkForm] = useState(false)
    const [showHighlight, setShowHighlight] = useState(false)
    const [showAI, setShowAI] = useState(false)
    const [linkValue, setLinkValue] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiError, setAiError] = useState<string | null>(null)
    const savedRange = useRef<Range | null>(null)
    const toolbarRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onSelChange = () => {
            const sel = window.getSelection()
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                // Only hide if not interacting with toolbar
                setPos(null)
                return
            }
            const node = sel.anchorNode
            const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement
            if (!el?.closest('[data-rich-text]')) { setPos(null); return }
            const range = sel.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            if (rect.width === 0) { setPos(null); return }
            savedRange.current = range.cloneRange()
            setShowLinkForm(false)
            setShowHighlight(false)
            setShowAI(false)
            setAiError(null)
            setPos({
                top: rect.top + window.scrollY - 56,
                left: rect.left + window.scrollX + rect.width / 2,
            })
        }
        document.addEventListener('selectionchange', onSelChange)
        return () => document.removeEventListener('selectionchange', onSelChange)
    }, [])

    const restoreSel = (): boolean => {
        if (!savedRange.current) return false
        const sel = window.getSelection()
        if (!sel) return false
        sel.removeAllRanges()
        sel.addRange(savedRange.current)
        return true
    }

    const exec = (cmd: string, value?: string) => {
        restoreSel()
        document.execCommand(cmd, false, value)
    }

    const applyStyle = (prop: string, value: string) => {
        if (!restoreSel()) return
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
        const range = sel.getRangeAt(0)
        const span = document.createElement('span')
            ; (span.style as any)[prop] = value
        try {
            range.surroundContents(span)
        } catch {
            const frag = range.extractContents()
            span.appendChild(frag)
            range.insertNode(span)
        }
        const nr = document.createRange()
        nr.selectNodeContents(span)
        sel.removeAllRanges()
        sel.addRange(nr)
        savedRange.current = nr.cloneRange()
    }

    const applyFontSize = (delta: number) => {
        if (!restoreSel()) return
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const node = sel.anchorNode
        const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement
        const cur = parseFloat(window.getComputedStyle(el!).fontSize) || 24
        applyStyle('fontSize', `${Math.max(8, Math.min(120, cur + delta))}px`)
    }

    const insertLink = (e: React.FormEvent) => {
        e.preventDefault()
        if (!linkValue.trim()) return
        const href = linkValue.startsWith('http') || linkValue.startsWith('#')
            ? linkValue
            : `https://${linkValue}`
        exec('createLink', href)
        setShowLinkForm(false)
        setLinkValue('')
        setPos(null)
    }

    const handleAI = async (mode: AIMode) => {
        if (!restoreSel()) return
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed) return
        const selectedText = sel.toString().trim()
        if (!selectedText) return

        setAiLoading(true)
        setAiError(null)
        setShowAI(false)

        const res = await textAiAction(selectedText, mode)

        if (res.success && res.result) {
            // Replace selection with AI result
            restoreSel()
            const sel2 = window.getSelection()
            if (sel2 && sel2.rangeCount > 0) {
                const range = sel2.getRangeAt(0)
                range.deleteContents()
                const textNode = document.createTextNode(res.result)
                range.insertNode(textNode)
                const nr = document.createRange()
                nr.selectNodeContents(textNode)
                sel2.removeAllRanges()
                sel2.addRange(nr)
            }
        } else {
            setAiError(res.error ?? 'Ката кетти')
        }

        setAiLoading(false)
        setPos(null)
    }

    if (!pos) return null

    return createPortal(
        <div
            ref={toolbarRef}
            className="absolute z-[9999] select-none"
            style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
            onMouseDown={e => e.preventDefault()}
        >
            {/* ── Main toolbar ── */}
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl flex items-center gap-0.5 px-2 py-1.5 border border-white/10">
                {/* Formatting */}
                {[
                    { icon: <Bold size={13} />, cmd: 'bold', title: 'Жоон' },
                    { icon: <Italic size={13} />, cmd: 'italic', title: 'Курсив' },
                    { icon: <Underline size={13} />, cmd: 'underline', title: 'Астыңкы' },
                    { icon: <Strikethrough size={13} />, cmd: 'strikeThrough', title: 'Сызылган' },
                ].map(({ icon, cmd, title }) => (
                    <button
                        key={cmd}
                        onMouseDown={e => { e.preventDefault(); exec(cmd) }}
                        className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center transition-colors text-white"
                        title={title}
                    >
                        {icon}
                    </button>
                ))}

                <div className="w-px h-4 bg-gray-600 mx-0.5" />

                {/* Font size */}
                <button onMouseDown={e => { e.preventDefault(); applyFontSize(-2) }} className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center text-white font-bold text-sm transition-colors">−</button>
                <button onMouseDown={e => { e.preventDefault(); applyFontSize(2) }} className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center text-white font-bold text-sm transition-colors">+</button>

                <div className="w-px h-4 bg-gray-600 mx-0.5" />

                {/* Text color palette */}
                {TEXT_PALETTE.map(c => (
                    <button
                        key={c}
                        onMouseDown={e => { e.preventDefault(); exec('foreColor', c) }}
                        className="w-4 h-4 rounded-full border border-gray-500 hover:scale-125 transition-transform shrink-0"
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
                <label className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:border-white transition-colors shrink-0 relative overflow-hidden" title="Башка түс">
                    <input type="color" className="opacity-0 absolute w-0 h-0" onMouseDown={restoreSel} onChange={e => exec('foreColor', e.target.value)} />
                    <span className="text-gray-400 text-[9px] font-bold">+</span>
                </label>

                <div className="w-px h-4 bg-gray-600 mx-0.5" />

                {/* Highlight (marker) */}
                <button
                    onMouseDown={e => { e.preventDefault(); setShowHighlight(v => !v); setShowLinkForm(false); setShowAI(false) }}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showHighlight ? 'bg-yellow-500 text-gray-900' : 'hover:bg-gray-700 text-yellow-300'}`}
                    title="Белги (маркер)"
                >
                    <Highlighter size={13} />
                </button>

                {/* Link */}
                <button
                    onMouseDown={e => { e.preventDefault(); setShowLinkForm(v => !v); setShowHighlight(false); setShowAI(false) }}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showLinkForm ? 'bg-blue-500 text-white' : 'hover:bg-gray-700 text-blue-300'}`}
                    title="Шилтеме"
                >
                    <Link size={13} />
                </button>

                {/* AI Wand */}
                <button
                    onMouseDown={e => { e.preventDefault(); setShowAI(v => !v); setShowLinkForm(false); setShowHighlight(false) }}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${showAI ? 'bg-purple-500 text-white' : 'hover:bg-gray-700 text-purple-300'} ${aiLoading ? 'animate-pulse' : ''}`}
                    title="AI Жардамчысы"
                    disabled={aiLoading}
                >
                    {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                </button>
            </div>

            {/* ── Highlight palette ── */}
            {showHighlight && (
                <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl p-2 shadow-2xl flex gap-1.5 flex-wrap w-[136px]">
                    {HIGHLIGHT_PALETTE.map(c => (
                        <button
                            key={c}
                            onMouseDown={e => {
                                e.preventDefault()
                                if (c === 'transparent') {
                                    exec('hiliteColor', 'transparent')
                                } else {
                                    exec('hiliteColor', c)
                                }
                                setShowHighlight(false)
                            }}
                            className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
                            style={{ backgroundColor: c === 'transparent' ? undefined : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg,#888 25%,transparent 25%,transparent 75%,#888 75%),linear-gradient(45deg,#888 25%,transparent 25%,transparent 75%,#888 75%)' : undefined, backgroundSize: '8px 8px', backgroundPosition: '0 0,4px 4px' }}
                            title={c === 'transparent' ? 'Арчуу' : c}
                        />
                    ))}
                </div>
            )}

            {/* ── Link form ── */}
            {showLinkForm && (
                <form
                    onSubmit={insertLink}
                    className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl p-2 shadow-2xl flex gap-1.5 items-center"
                    onMouseDown={e => e.stopPropagation()}
                >
                    <input
                        type="text"
                        placeholder="URL же #slide-2"
                        value={linkValue}
                        onChange={e => setLinkValue(e.target.value)}
                        className="w-48 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                        autoFocus
                    />
                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors">ОК</button>
                    <button type="button" onMouseDown={e => { e.preventDefault(); setShowLinkForm(false) }} className="text-gray-400 hover:text-white">
                        <X size={13} />
                    </button>
                </form>
            )}

            {/* ── AI menu ── */}
            {showAI && (
                <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl p-1.5 shadow-2xl flex flex-col gap-0.5 min-w-[160px]">
                    <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider px-2 py-1">AI Жардамчысы ✨</p>
                    {AI_MODES.map(m => (
                        <button
                            key={m.id}
                            onMouseDown={e => { e.preventDefault(); handleAI(m.id) }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-purple-600/40 text-white text-xs font-medium transition-colors text-left"
                        >
                            <span className="text-base leading-none">{m.icon}</span>
                            {m.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── AI error ── */}
            {aiError && (
                <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-red-900/95 border border-red-500/30 rounded-xl px-3 py-2 shadow-2xl text-xs text-red-300 whitespace-nowrap">
                    {aiError}
                </div>
            )}

            {/* Caret */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 rounded-sm border-r border-b border-white/10" />
        </div>,
        document.body
    )
}
