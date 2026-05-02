'use client'

import Link from 'next/link'
import { LoginButton } from '@/components/auth/LoginButton'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { decodeToken } from '@/lib/auth/auth-helpers'

export function Navbar() {
  const [user, setUser] = useState<{ email: string; name: string; role?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split('; ')
      const authToken = cookies.find(row => row.startsWith('auth_token='))?.split('=')[1]

      if (authToken) {
        const payload = decodeToken(authToken)
        if (payload) {
          setUser({
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            role: payload.role
          })
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const handleSignOut = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    setUser(null)
    window.location.href = '/'
  }

  const isAdmin = user?.role === 'admin'

  // Only show navbar on admin pages and upgrade page
  // Main app (/) uses the AppSidebar; editor/presentation have their own UI
  const showNavbar =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/dashboard/upgrade') ||
    pathname?.startsWith('/auth')

  if (!showNavbar) return null

  return (
    <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Slide
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {!isLoading && (
            user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-bold text-purple-600 hover:text-purple-700">
                    Admin
                  </Link>
                )}
                <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
                >
                  Sign Out
                </button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isAdmin ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {user.name?.[0].toUpperCase() || user.email?.[0].toUpperCase()}
                </div>
              </>
            ) : (
              <LoginButton />
            )
          )}
        </div>
      </div>
    </nav>
  )
}
