import { supabase } from '@/lib/supabase/client'
import type { User, UserRole, ExternalRoleCheck } from '@/types/auth'

/**
 * Check external API for user role and subscription status
 */
export async function checkExternalRole(googleId: string): Promise<{ role: UserRole; expires_at: string | null }> {
  const externalApiUrl = process.env.EXTERNAL_CHECK_USER_URL
  const apiKey = process.env.EXTERNAL_API_KEY

  // Default values
  let userRole: UserRole = 'user'
  let expiresAt: string | null = null

  // Validation
  if (!externalApiUrl || !googleId) {
    console.error('External API URL or Google ID is not set.')
    return { role: userRole, expires_at: expiresAt }
  }

  try {
    const requestUrl = `${externalApiUrl}?google_id=${encodeURIComponent(googleId)}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (apiKey) {
      headers['X-API-Key'] = apiKey
    }

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers,
      next: { revalidate: 0 }, // Don't cache
    })

    if (response.ok) {
      const extUser: ExternalRoleCheck = await response.json()

      // Check for ADMIN role (priority)
      if (extUser.role &&
          (extUser.role.toUpperCase() === 'ADMINISTRATOR' ||
           extUser.role.toUpperCase() === 'ADMIN')) {
        userRole = 'admin'
      }
      // Check for active subscription
      else if (extUser.subscriptions && Array.isArray(extUser.subscriptions)) {
        for (const sub of extUser.subscriptions) {
          if (sub.is_active && sub.expires_at) {
            const expiresDate = new Date(sub.expires_at)
            if (expiresDate > new Date()) {
              userRole = 'teacher'
              expiresAt = sub.expires_at
              break
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking external role:', error)
  }

  return { role: userRole, expires_at: expiresAt }
}

/**
 * Decode JWT token payload
 */
export function decodeToken(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    
    // In server-side (Node.js), use Buffer if available. 
    // In Edge Runtime or Browser, use atob and handle UTF-8.
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

/**
 * Get current session and user from auth_token cookie
 */
export async function getCurrentSession() {
  let authToken: string | undefined

  if (typeof window === 'undefined') {
    // Server-side
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    authToken = cookieStore.get('auth_token')?.value
  } else {
    // Client-side
    const cookies = document.cookie.split('; ')
    authToken = cookies.find(row => row.startsWith('auth_token='))?.split('=')[1]
  }

  if (!authToken) {
    return null
  }

  const payload = decodeToken(authToken)
  if (!payload) {
    return null
  }

  // Return a session-like object that matches what the app expects
  return {
    user: {
      id: payload.user_id?.toString(), // Ensure it's a string if it's an ID
      email: payload.email,
      user_metadata: {
        full_name: payload.name,
        google_id: payload.google_id
      }
    },
    access_token: authToken
  }
}

/**
 * Get user from database by google_id
 */
export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .single()

  if (error || !data) {
    return null
  }

  return data as User
}

/**
 * Upsert user in database
 */
export async function upsertUser(user: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'google_id' })
    .select()
    .single()

  if (error || !data) {
    console.error('Error upserting user:', error)
    return null
  }

  return data as User
}

/**
 * Sign in with External Auth Service
 */
export async function signInWithGoogle() {
  const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL
  
  if (!authServiceUrl) {
    console.error('NEXT_PUBLIC_AUTH_SERVICE_URL is not set.')
    return
  }

  // Redirect to external auth service
  window.location.href = authServiceUrl
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

/**
 * Check if user can manage content (Teacher or Admin)
 */
export function canManageContent(role: UserRole | null): boolean {
  return hasRole(role, ['teacher', 'admin'])
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole | null): boolean {
  return hasRole(role, ['admin'])
}
