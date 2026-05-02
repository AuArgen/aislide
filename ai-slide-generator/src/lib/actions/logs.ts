'use server'

import { db } from '@/lib/db'
import { randomUUID } from 'node:crypto'

export async function saveAiLog(data: {
  user_id: string
  presentation_id?: string | null
  prompt: string
  client_prompt?: string | null
  full_prompt?: string | null
  response?: string | null
  is_valid?: boolean
  tokens_used?: number
  cost_usd?: number
  duration_ms?: number
}) {
  try {
    const id = randomUUID()
    const now = new Date().toISOString()
    db.prepare(`
      INSERT INTO ai_logs
        (id, user_id, presentation_id, prompt, client_prompt, full_prompt, response,
         is_valid, tokens_used, cost_usd, duration_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.user_id,
      data.presentation_id ?? null,
      data.prompt,
      data.client_prompt ?? null,
      data.full_prompt ?? null,
      data.response ?? null,
      data.is_valid ? 1 : 0,
      data.tokens_used ?? 0,
      data.cost_usd ?? 0,
      data.duration_ms ?? 0,
      now,
    )
    return id
  } catch (err) {
    console.error('Failed to save AI log:', err)
    return null
  }
}

export async function updateAiLog(
  id: string,
  data: {
    presentation_id?: string | null
    response?: string | null
    is_valid?: boolean
    tokens_used?: number
    cost_usd?: number
    duration_ms?: number
    full_prompt?: string | null
  },
) {
  try {
    const fields: string[] = []
    const values: any[] = []

    if (data.presentation_id !== undefined) { fields.push('presentation_id = ?'); values.push(data.presentation_id) }
    if (data.response !== undefined) { fields.push('response = ?'); values.push(data.response) }
    if (data.is_valid !== undefined) { fields.push('is_valid = ?'); values.push(data.is_valid ? 1 : 0) }
    if (data.tokens_used !== undefined) { fields.push('tokens_used = ?'); values.push(data.tokens_used) }
    if (data.cost_usd !== undefined) { fields.push('cost_usd = ?'); values.push(data.cost_usd) }
    if (data.duration_ms !== undefined) { fields.push('duration_ms = ?'); values.push(data.duration_ms) }
    if (data.full_prompt !== undefined) { fields.push('full_prompt = ?'); values.push(data.full_prompt) }

    if (fields.length === 0) return true

    values.push(id)
    db.prepare(`UPDATE ai_logs SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return true
  } catch (err) {
    console.error('Failed to update AI log:', err)
    return false
  }
}
