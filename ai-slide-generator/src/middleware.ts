import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyInternalToken, checkExternalRole, generateInternalToken } from './lib/auth/edge'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const authToken = req.cookies.get('auth_token')?.value

  let session = null
  let shouldRefreshCookie = false
  let updatedToken = ''

  if (authToken) {
    const payload = await verifyInternalToken(authToken)
    if (payload) {
      const now = Math.floor(Date.now() / 1000)
      const iat = payload.iat || 0

      // Re-validate role every 1 hour
      if (now - iat > 3600) {
        const { role: newRole } = await checkExternalRole(payload.google_id)

        const newToken = await generateInternalToken({
          ...payload,
          role: newRole,
          iat: now,
        })

        if (newToken) {
          updatedToken = newToken
          shouldRefreshCookie = true
          session = {
            user: {
              id: payload.user_id?.toString(),
              email: payload.email,
              role: newRole,
              user_metadata: { full_name: payload.name, google_id: payload.google_id },
            },
          }
        }
      }

      if (!session) {
        session = {
          user: {
            id: payload.user_id?.toString(),
            email: payload.email,
            role: payload.role,
            user_metadata: { full_name: payload.name, google_id: payload.google_id },
          },
        }
      }
    }
  }

  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
  const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard')
  const isEditorPage = req.nextUrl.pathname.startsWith('/editor')

  if (!session && (isAdminPage || isDashboardPage || isEditorPage)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (shouldRefreshCookie && updatedToken) {
    const response = NextResponse.next()
    response.cookies.set('auth_token', updatedToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false,
    })
    return response
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/editor/:path*'],
}
