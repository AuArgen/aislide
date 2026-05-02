'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { useT, useLanguage } from './LanguageProvider'
import { LANGUAGE_FLAGS, LANGUAGE_NAMES, type Language } from '@/lib/i18n'

interface Presentation {
  id: string
  title: string
  created_at: string
  slides?: any[]
}

interface AppSidebarProps {
  user: {
    id: string
    email: string
    full_name: string
    role: string
  } | null
  presentations: Presentation[]
  isPremium: boolean
  isAdmin: boolean
}

const LANGUAGES: Language[] = ['ky', 'ru', 'en']

export function AppSidebar({ user, presentations, isPremium, isAdmin }: AppSidebarProps) {
  const t = useT()
  const { language, setLanguage } = useLanguage()
  const [showLangPicker, setShowLangPicker] = useState(false)
  const pathname = usePathname()

  const handleSignOut = useCallback(() => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/'
  }, [])

  const initials = user
    ? (user.full_name || user.email).split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <aside className="w-64 h-screen flex flex-col bg-[#0f172a] text-white flex-shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/40">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">AI Slide</span>
        </Link>
      </div>

      {/* New Presentation Button */}
      <div className="px-3 pb-3">
        {user ? (
          <Link
            href="/"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-semibold text-white shadow-lg shadow-blue-900/30"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t('nav.newPresentation')}
          </Link>
        ) : (
          <GoogleSignInButton label={t('auth.signIn')} />
        )}
      </div>

      {/* Presentations list */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5 custom-scroll-dark">
        {user && (
          <>
            <p className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
              {t('nav.recent')}
            </p>
            {presentations.length === 0 ? (
              <p className="px-2 py-2 text-xs text-slate-500 italic">{t('nav.noRecent')}</p>
            ) : (
              presentations.slice(0, 20).map((p) => (
                <Link
                  key={p.id}
                  href={`/editor/${p.id}`}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors group ${
                    pathname === `/editor/${p.id}`
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate leading-snug">{p.title}</span>
                </Link>
              ))
            )}
          </>
        )}

        {!user && (
          <div className="px-2 py-3 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Features</p>
            {[
              { icon: '🤖', key: 'home.feature1Title' },
              { icon: '🎨', key: 'home.feature2Title' },
              { icon: '📤', key: 'home.feature3Title' },
            ].map((f) => (
              <div key={f.key} className="flex items-center gap-2.5 text-sm text-slate-400">
                <span className="text-base">{f.icon}</span>
                <span>{t(f.key)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="px-3 pt-2 pb-4 border-t border-white/5 space-y-1">
        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="text-base">{LANGUAGE_FLAGS[language]}</span>
            <span className="flex-1 text-left font-medium">{LANGUAGE_NAMES[language]}</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${showLangPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showLangPicker && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1e293b] rounded-xl border border-white/10 shadow-xl overflow-hidden">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLangPicker(false) }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors ${
                    language === lang
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{LANGUAGE_FLAGS[lang]}</span>
                  <span className="font-medium">{LANGUAGE_NAMES[lang]}</span>
                  {language === lang && (
                    <svg className="w-4 h-4 ml-auto text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Admin link */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t('nav.adminPanel')}
          </Link>
        )}

        {/* User section */}
        {user ? (
          <div className="mt-1">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isAdmin ? 'bg-purple-600' : isPremium ? 'bg-emerald-600' : 'bg-blue-600'
              }`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user.full_name || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-slate-500 truncate leading-tight">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-white/5 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('nav.signOut')}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function GoogleSignInButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const { signInWithGoogle } = await import('@/lib/auth/auth-helpers')
      await signInWithGoogle()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-800 shadow-lg disabled:opacity-70"
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {loading ? '...' : label}
    </button>
  )
}
