'use client'

import Link from 'next/link'
import { LoginButton } from '@/components/auth/LoginButton'
import { useEffect, useState } from 'react'
import { decodeToken } from '@/lib/auth/auth-helpers'

export function Navbar() {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split('; ')
      const authToken = cookies.find(row => row.startsWith('auth_token='))?.split('=')[1]

      if (authToken) {
        const payload = decodeToken(authToken)
        if (payload) {
          setUser({
            email: payload.email,
            name: payload.name || payload.email.split('@')[0]
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
    
    // Listen for cookie changes or storage events if needed
    // For now, simple check on mount
  }, [])

  const handleSignOut = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    setUser(null)
    window.location.href = '/'
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
          {!isLoading && (
            user ? (
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
