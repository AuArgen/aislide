import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { db } from '@/lib/db'
import { randomUUID } from 'node:crypto'

const ALLOWED_USER_EVENTS = ['user_add_slide', 'user_delete_slide', 'user_duplicate_slide'] as const

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { presentation_id, event_type, slide_index, slide_count } = body

    if (!presentation_id || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_USER_EVENTS.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const id = randomUUID()
    db.prepare(`
      INSERT INTO presentation_events
        (id, presentation_id, user_id, event_type, slide_index, slide_count,
         model, input_tokens, output_tokens, total_tokens, cost_usd, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, 'none', 0, 0, 0, 0, 0)
    `).run(
      id,
      presentation_id,
      session.user.id,
      event_type,
      slide_index ?? null,
      slide_count ?? null,
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Analytics event error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
