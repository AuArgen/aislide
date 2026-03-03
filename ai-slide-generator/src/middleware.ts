import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeToken } from './lib/auth/auth-helpers'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Get auth_token from cookies
  const authToken = req.cookies.get('auth_token')?.value
  
  let session = null
  if (authToken) {
    const payload = decodeToken(authToken)
    if (payload) {
      session = {
        user: {
          id: payload.user_id?.toString(),
          email: payload.email,
          user_metadata: {
            full_name: payload.name,
            google_id: payload.google_id
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

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/editor/:path*'],
}
