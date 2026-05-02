'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useLanguageStore } from '@/store/languageStore'
import {
  type Language,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  createT,
  detectBrowserLanguage,
} from '@/lib/i18n'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}

export function useT() {
  const { t } = useLanguage()
  return t
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { language, hasChosen, setLanguage } = useLanguageStore()

  useEffect(() => {
    if (!hasChosen) {
      // Silently apply detected language — no prompt needed if it matches
      setLanguage(detectBrowserLanguage())
    }
  }, [hasChosen, setLanguage])

  // Sync to DB whenever language changes (no-ops silently if not authenticated)
  useEffect(() => {
    if (!language) return
    fetch('/api/user/language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    }).catch(() => {})
  }, [language])

  const currentLang: Language = language ?? 'ky'
  const t = useMemo(() => createT(currentLang), [currentLang])

  const value: LanguageContextValue = useMemo(
    () => ({ language: currentLang, setLanguage, t }),
    [currentLang, setLanguage, t]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
