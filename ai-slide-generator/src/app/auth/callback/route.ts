import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkExternalRole, upsertUser, decodeToken } from '@/lib/auth/auth-helpers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')

  if (token) {
    try {
      const payload = decodeToken(token)
      
      if (!payload) {
        console.error('Invalid token format')
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      const googleId = payload.google_id
      const email = payload.email
      const name = payload.name || email.split('@')[0]

      if (!googleId || !email) {
        console.error('Invalid token payload:', payload)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      // Check for external role
      const { role, expires_at } = await checkExternalRole(googleId)

      // Save/Update user in our database
      const userData = {
        google_id: googleId,
        email: email,
        full_name: name,
        role: role,
        last_login: new Date().toISOString(),
      }
      
      await upsertUser(userData)

      // In this setup, we might need a way to maintain the session
      // For now, let's redirect to dashboard
      // Note: If you need Supabase Auth session, you'll need to handle it separately
      
      const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      
      // Store token in cookie for client-side access if needed
      response.cookies.set('auth_token', token, { 
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: false // Allow client-side access to check if logged in
      })
      
      return response
    } catch (error) {
      console.error('Error processing token:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
    }
  }

  // Redirect to home if no token
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
