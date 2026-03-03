'use client'

import Link from 'next/link'
import { LoginButton } from '@/components/auth/LoginButton'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

export function Navbar() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Slide
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Башкы бет
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
              >
                Чыгуу
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                 {session.user.email?.[0].toUpperCase()}
              </div>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </nav>
  )
}
