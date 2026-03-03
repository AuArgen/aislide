import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { checkExternalRole, upsertUser } from '@/lib/auth/auth-helpers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session) {
      console.error('Auth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
    }

    const user = session.user
    const googleId = user.id // Supabase user ID is used as unique identifier

    // Check for external role
    const { role, expires_at } = await checkExternalRole(googleId)

    // Save/Update user in our database
    await upsertUser({
      google_id: googleId,
      email: user.email || '',
      full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata.avatar_url || null,
      role: role,
      last_login: new Date().toISOString(),
    })
  }

  // Redirect to dashboard after successful login
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
