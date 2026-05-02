'use server'

import { db } from '@/lib/db'
import { randomUUID } from 'node:crypto'
import { getCurrentSession } from '@/lib/auth/auth-helpers'

export type PresentationEventType =
  | 'ai_generate_presentation'
  | 'ai_generate_slide'
  | 'ai_edit_text'
  | 'user_add_slide'
  | 'user_delete_slide'
  | 'user_duplicate_slide'

export interface PresentationEvent {
  id: string
  presentation_id: string
  user_id: string
  event_type: PresentationEventType
  slide_index: number | null
  slide_count: number | null
  prompt: string | null
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  duration_ms: number
  metadata: Record<string, any> | null
  created_at: string
}

export async function logPresentationEvent(data: {
  presentation_id: string
  user_id: string
  event_type: PresentationEventType
  slide_index?: number | null
  slide_count?: number | null
  prompt?: string | null
  model?: string
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  cost_usd?: number
  duration_ms?: number
  metadata?: Record<string, any> | null
}): Promise<string | null> {
  try {
    const id = randomUUID()
    db.prepare(`
      INSERT INTO presentation_events
        (id, presentation_id, user_id, event_type, slide_index, slide_count,
         prompt, model, input_tokens, output_tokens, total_tokens,
         cost_usd, duration_ms, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.presentation_id,
      data.user_id,
      data.event_type,
      data.slide_index ?? null,
      data.slide_count ?? null,
      data.prompt ?? null,
      data.model ?? 'gemini-2.5-flash',
      data.input_tokens ?? 0,
      data.output_tokens ?? 0,
      data.total_tokens ?? 0,
      data.cost_usd ?? 0,
      data.duration_ms ?? 0,
      data.metadata ? JSON.stringify(data.metadata) : null,
    )
    return id
  } catch (err) {
    console.error('Failed to log presentation event:', err)
    return null
  }
}

export async function getPresentationAnalytics(presentationId: string): Promise<PresentationEvent[] | null> {
  const session = await getCurrentSession()
  if (!session) return null

  const rows = db.prepare(`
    SELECT * FROM presentation_events
    WHERE presentation_id = ?
    ORDER BY created_at ASC
  `).all(presentationId) as any[]

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }))
}

export async function getPresentationTokenSummary(presentationId: string) {
  const session = await getCurrentSession()
  if (!session) return null

  return db.prepare(`
    SELECT
      event_type,
      COUNT(*) as count,
      SUM(input_tokens) as input_tokens,
      SUM(output_tokens) as output_tokens,
      SUM(total_tokens) as total_tokens,
      SUM(cost_usd) as cost_usd
    FROM presentation_events
    WHERE presentation_id = ?
    GROUP BY event_type
    ORDER BY SUM(total_tokens) DESC
  `).all(presentationId) as any[]
}

export async function getAllPresentationsAnalytics(limit = 50) {
  const session = await getCurrentSession()
  if (!session || session.user.role !== 'admin') return null

  return db.prepare(`
    SELECT
      pe.presentation_id,
      p.title,
      u.full_name,
      u.email,
      COUNT(*) as event_count,
      SUM(pe.total_tokens) as total_tokens,
      SUM(pe.cost_usd) as total_cost,
      MIN(pe.created_at) as first_event,
      MAX(pe.created_at) as last_event
    FROM presentation_events pe
    LEFT JOIN presentations p ON pe.presentation_id = p.id
    LEFT JOIN users u ON pe.user_id = u.id
    GROUP BY pe.presentation_id
    ORDER BY MAX(pe.created_at) DESC
    LIMIT ?
  `).all(limit) as any[]
}
