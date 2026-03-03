import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
  const isDashboardPage = req.nextUrl.pathname.startsWith('/dashboard')
  const isEditorPage = req.nextUrl.pathname.startsWith('/editor')
  const isPresentationPage = req.nextUrl.pathname.startsWith('/presentation')

  // If not logged in and trying to access protected routes
  // Presentation page is public
  if (!session && (isAdminPage || isDashboardPage || isEditorPage)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If logged in, check role for admin pages
  if (session && isAdminPage) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/editor/:path*'],
}
