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
 * Get current session and user
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
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
 * Sign in with Google
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error signing in:', error)
    throw error
  }
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
