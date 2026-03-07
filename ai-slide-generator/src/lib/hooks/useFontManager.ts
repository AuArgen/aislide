'use client'

import { useState, useCallback, useRef } from 'react'

// ─── Available Google Fonts ───────────────────────────────────────────────────

export const GOOGLE_FONTS = [
    { name: 'Roboto', family: "'Roboto', sans-serif", url: 'Roboto:wght@400;700' },
    { name: 'Open Sans', family: "'Open Sans', sans-serif", url: 'Open+Sans:wght@400;700' },
    { name: 'Lato', family: "'Lato', sans-serif", url: 'Lato:wght@400;700' },
    { name: 'Montserrat', family: "'Montserrat', sans-serif", url: 'Montserrat:wght@400;700' },
    { name: 'Poppins', family: "'Poppins', sans-serif", url: 'Poppins:wght@400;700' },
    { name: 'Raleway', family: "'Raleway', sans-serif", url: 'Raleway:wght@400;700' },
    { name: 'Nunito', family: "'Nunito', sans-serif", url: 'Nunito:wght@400;700' },
    { name: 'Outfit', family: "'Outfit', sans-serif", url: 'Outfit:wght@400;700' },
    { name: 'Inter', family: "'Inter', sans-serif", url: 'Inter:wght@400;700' },
    { name: 'Playfair Display', family: "'Playfair Display', serif", url: 'Playfair+Display:wght@400;700' },
    { name: 'Merriweather', family: "'Merriweather', serif", url: 'Merriweather:wght@400;700' },
    { name: 'Lora', family: "'Lora', serif", url: 'Lora:wght@400;700' },
    { name: 'PT Serif', family: "'PT Serif', serif", url: 'PT+Serif:wght@400;700' },
    { name: 'Oswald', family: "'Oswald', sans-serif", url: 'Oswald:wght@400;700' },
    { name: 'Bebas Neue', family: "'Bebas Neue', cursive", url: 'Bebas+Neue' },
    { name: 'Pacifico', family: "'Pacifico', cursive", url: 'Pacifico' },
    { name: 'Dancing Script', family: "'Dancing Script', cursive", url: 'Dancing+Script:wght@400;700' },
    { name: 'Fira Code', family: "'Fira Code', monospace", url: 'Fira+Code:wght@400;700' },
    { name: 'Source Code Pro', family: "'Source Code Pro', monospace", url: 'Source+Code+Pro:wght@400;700' },
    { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", url: 'Space+Grotesk:wght@400;700' },
]

export const SYSTEM_FONTS = [
    { name: 'System Default', family: 'system-ui, sans-serif', url: null },
    { name: 'Georgia', family: 'Georgia, serif', url: null },
    { name: 'Times New Roman', family: "'Times New Roman', serif", url: null },
    { name: 'Arial', family: 'Arial, sans-serif', url: null },
    { name: 'Courier New', family: "'Courier New', monospace", url: null },
]

export const ALL_FONTS = [...GOOGLE_FONTS, ...SYSTEM_FONTS]

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFontManager(initialRecentFonts: string[] = []) {
    const [recentFonts, setRecentFonts] = useState<string[]>(initialRecentFonts)
    const loadedFonts = useRef<Set<string>>(new Set())

    const loadFont = useCallback(async (fontName: string) => {
        const font = GOOGLE_FONTS.find(f => f.name === fontName)
        if (!font || !font.url) return // System font, no loading needed

        if (loadedFonts.current.has(fontName)) return // Already loaded

        // Inject <link> into document head
        const linkId = `gfont-${fontName.replace(/\s+/g, '-').toLowerCase()}`
        if (document.getElementById(linkId)) {
            loadedFonts.current.add(fontName)
            return
        }

        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${font.url}&display=swap`
        document.head.appendChild(link)

        // Wait for load
        await new Promise<void>((resolve) => {
            link.onload = () => resolve()
            link.onerror = () => resolve() // Resolve even on error to not block UI
            setTimeout(resolve, 3000) // Timeout fallback
        })

        loadedFonts.current.add(fontName)
    }, [])

    const selectFont = useCallback(async (fontName: string): Promise<string> => {
        await loadFont(fontName)

        // Update recently used (max 4)
        setRecentFonts(prev => {
            const filtered = prev.filter(f => f !== fontName)
            return [fontName, ...filtered].slice(0, 4)
        })

        const font = ALL_FONTS.find(f => f.name === fontName)
        return font?.family ?? fontName
    }, [loadFont])

    return { recentFonts, selectFont, loadFont }
}
