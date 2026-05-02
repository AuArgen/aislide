/**
 * Edge Runtime-compatible auth utilities.
 * No Node.js native modules or DB imports — safe for Next.js middleware.
 */
import { signJWT, verifyJWT } from './jwt'
import type { UserRole, ExternalRoleCheck } from '@/types/auth'

export async function verifyInternalToken(token: string): Promise<any | null> {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  return await verifyJWT(token, secret)
}

export async function generateInternalToken(payload: any): Promise<string | null> {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  return await signJWT(payload, secret)
}

export async function checkExternalRole(googleId: string): Promise<{ role: UserRole; expires_at: string | null }> {
  const externalApiUrl = process.env.EXTERNAL_CHECK_USER_URL
  const apiKey = process.env.EXTERNAL_API_KEY
  let userRole: UserRole = 'user'
  let expiresAt: string | null = null

  if (!externalApiUrl || !googleId) {
    console.error('External API URL or Google ID is not set.')
    return { role: userRole, expires_at: expiresAt }
  }

  try {
    const requestUrl = `${externalApiUrl}?google_id=${encodeURIComponent(googleId)}`
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (apiKey) headers['X-API-Key'] = apiKey

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers,
      next: { revalidate: 0 },
    })

    const extUser: ExternalRoleCheck = await response.json()
    console.log(`[Auth] External role check for ${googleId}:`, JSON.stringify(extUser, null, 2))

    if (response.ok) {
      if (extUser.role && (extUser.role.toUpperCase() === 'ADMINISTRATOR' || extUser.role.toUpperCase() === 'ADMIN')) {
        userRole = 'admin'
      } else if (extUser.subscriptions && Array.isArray(extUser.subscriptions)) {
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
