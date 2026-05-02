import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/lib/i18n'

interface LanguageState {
  language: Language | null
  hasChosen: boolean
  setLanguage: (lang: Language) => void
  markChosen: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: null,
      hasChosen: false,
      setLanguage: (language) => set({ language, hasChosen: true }),
      markChosen: () => set({ hasChosen: true }),
    }),
    {
      name: 'aislide-language',
    }
  )
)
