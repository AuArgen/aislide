import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyInternalToken, checkExternalRole, generateInternalToken, upsertUser } from './lib/auth/auth-helpers'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Get auth_token from cookies
  const authToken = req.cookies.get('auth_token')?.value

  let session = null
  let shouldRefreshCookie = false
  let updatedToken = ''

  if (authToken) {
    const payload = await verifyInternalToken(authToken)
    if (payload) {
      const now = Math.floor(Date.now() / 1000)
      const iat = payload.iat || 0

      // Re-validate every 1 hour (3600 seconds)
      if (now - iat > 3600) {
        const { role: newRole } = await checkExternalRole(payload.google_id)

        // Update DB if role changed
        if (newRole !== payload.role) {
          await upsertUser({
            google_id: payload.google_id,
            role: newRole
          })
        }

        // Generate new token with updated iat and potentially updated role
        const newToken = await generateInternalToken({
          ...payload,
          role: newRole,
          iat: now // Refresh iat to prevent immediate re-validation
        })

        if (newToken) {
          updatedToken = newToken
          shouldRefreshCookie = true

          // Update session for current request
          session = {
            user: {
              id: payload.user_id?.toString(),
              email: payload.email,
              role: newRole,
              user_metadata: {
                full_name: payload.name,
                google_id: payload.google_id
              }
            }
          }
        }
      }

      if (!session) {
        session = {
          user: {
            id: payload.user_id?.toString(),
            email: payload.email,
            role: payload.role,
            user_metadata: {
              full_name: payload.name,
              google_id: payload.google_id
            }
          }
        }
      }
    }
  }

  // Protected routes
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
  const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard')
  const isEditorPage = req.nextUrl.pathname.startsWith('/editor')

  // If not logged in and trying to access protected routes
  if (!session && (isAdminPage || isDashboardPage || isEditorPage)) {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }

  // Update cookie if needed
  const response = shouldRefreshCookie ? NextResponse.next() : res
  if (shouldRefreshCookie && updatedToken) {
    response.cookies.set('auth_token', updatedToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: false
    })
    return response
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/editor/:path*'],
}
