import { NextResponse, type NextRequest } from 'next/server'

function getRequestOrigin(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')

  if (host) return `${proto}://${host}`
  return request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const authServiceUrl = process.env.AUTH_SERVICE_URL ?? process.env.NEXT_PUBLIC_AUTH_SERVICE_URL

  if (!authServiceUrl) {
    return NextResponse.json(
      { error: 'AUTH_SERVICE_URL or NEXT_PUBLIC_AUTH_SERVICE_URL is not configured' },
      { status: 500 },
    )
  }

  try {
    const url = new URL(authServiceUrl)
    url.searchParams.set('redirect_url', `${getRequestOrigin(request)}/auth/callback`)
    return NextResponse.redirect(url.toString())
  } catch {
    return NextResponse.json({ error: 'Invalid auth service URL' }, { status: 500 })
  }
}
