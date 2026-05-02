import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { getUserByGoogleId } from '@/lib/auth/auth-db'
import { updateUserLanguage } from '@/lib/actions/user'

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { language } = await req.json()
    const allowed = ['ky', 'ru', 'en']
    if (!allowed.includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }

    const googleId = session.user.user_metadata?.google_id
    if (!googleId) return NextResponse.json({ error: 'No google_id' }, { status: 400 })

    const user = await getUserByGoogleId(googleId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await updateUserLanguage(user.id, language)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
