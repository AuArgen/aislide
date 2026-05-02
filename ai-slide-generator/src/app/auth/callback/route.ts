import { NextResponse } from 'next/server'
import { checkExternalRole, decodeToken } from '@/lib/auth/auth-helpers'
import { upsertUser } from '@/lib/auth/auth-db'
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

      const { role, expires_at } = await checkExternalRole(googleId)

      const savedUser = upsertUser({
        google_id: googleId,
        email,
        full_name: name,
        avatar_url: avatarUrl,
        role,
        last_login: new Date().toISOString(),
      })

      if (!savedUser) {
        console.error('Failed to save user')
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        console.error('JWT_SECRET is not set in environment variables')
        return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
      }

      const internalToken = await signJWT({
        user_id: savedUser.id,
        google_id: googleId,
        email,
        name,
        role,
        expires_at,
      }, jwtSecret)

      const response = NextResponse.redirect(`${requestUrl.origin}/`)
      response.cookies.set('auth_token', internalToken, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: false,
      })

      return response
    } catch (error) {
      console.error('Error processing token:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/`)
}
