import type { UserRole } from '@/types/auth'

export { verifyInternalToken, generateInternalToken, checkExternalRole } from './edge'

export function decodeToken(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

    let jsonPayload: string
    if (typeof Buffer !== 'undefined') {
      jsonPayload = Buffer.from(base64, 'base64').toString('utf-8')
    } else {
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      jsonPayload = new TextDecoder().decode(bytes)
    }

    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error('Error decoding token:', e)
    return null
  }
}

export async function getCurrentSession() {
  let authToken: string | undefined

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    authToken = cookieStore.get('auth_token')?.value
  } else {
    const cookieList = document.cookie.split('; ')
    authToken = cookieList.find(row => row.startsWith('auth_token='))?.split('=')[1]
  }

  if (!authToken) return null

  const payload = decodeToken(authToken)
  if (!payload) return null

  return {
    user: {
      id: payload.user_id?.toString(),
      email: payload.email,
      role: payload.role as UserRole,
      user_metadata: {
        full_name: payload.name,
        google_id: payload.google_id,
      },
    },
    access_token: authToken,
    issued_at: payload.iat,
  }
}

export function signInWithGoogle() {
  window.location.href = '/api/auth/google-login'
}

export function signOut() {
  document.cookie = 'auth_token=; path=/; max-age=0'
  window.location.href = '/'
}

export function hasRole(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

export function canManageContent(role: UserRole | null): boolean {
  return hasRole(role, ['teacher', 'admin'])
}

export function isAdmin(role: UserRole | null): boolean {
  return hasRole(role, ['admin'])
}
