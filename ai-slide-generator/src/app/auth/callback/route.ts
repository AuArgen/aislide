import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkExternalRole, upsertUser, decodeToken } from '@/lib/auth/auth-helpers'
import { signJWT } from '@/lib/auth/jwt'
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
      const avatarUrl = payload.picture || payload.avatar_url || null

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
        avatar_url: avatarUrl,
        role: role,
        last_login: new Date().toISOString(),
      }

      const savedUser = await upsertUser(userData)

      if (!savedUser) {
        console.error('Failed to save user')
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      // Create our own project-specific token
      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        console.error('JWT_SECRET is not set in environment variables')
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      const internalToken = await signJWT({
        user_id: savedUser.id,
        google_id: googleId,
        email: email,
        name: name,
        role: role,
        expires_at: expires_at
      }, jwtSecret)

      const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

      // Store our internal token in cookie
      response.cookies.set('auth_token', internalToken, {
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
