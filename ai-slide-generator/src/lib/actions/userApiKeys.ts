'use server'

import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth/auth-helpers'

type AiProvider = 'gemini' | 'openai'

const PROVIDERS: AiProvider[] = ['gemini', 'openai']

function isProvider(value: string): value is AiProvider {
  return PROVIDERS.includes(value as AiProvider)
}

export async function getCurrentUserApiKey(provider: string): Promise<string | null> {
  const session = await getCurrentSession()
  if (!session?.user?.id || !isProvider(provider)) return null

  const row = db
    .prepare('SELECT api_key FROM user_api_keys WHERE user_id = ? AND provider = ?')
    .get(session.user.id, provider) as { api_key: string } | undefined

  return row?.api_key ?? null
}

export async function getUserApiKeyStatus(): Promise<{ success: boolean; keys: Record<AiProvider, boolean> }> {
  const session = await getCurrentSession()
  const empty = { gemini: false, openai: false }
  if (!session?.user?.id) return { success: false, keys: empty }

  const rows = db
    .prepare('SELECT provider FROM user_api_keys WHERE user_id = ?')
    .all(session.user.id) as Array<{ provider: string }>

  const keys: Record<AiProvider, boolean> = { ...empty }
  for (const row of rows) {
    if (isProvider(row.provider)) keys[row.provider] = true
  }

  return { success: true, keys }
}

export async function saveUserApiKey(provider: string, apiKey: string) {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }
  if (!isProvider(provider)) return { success: false, error: 'Invalid provider' }

  const normalizedKey = apiKey.trim()
  if (!normalizedKey) return { success: false, error: 'API key is empty' }

  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO user_api_keys (user_id, provider, api_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, provider) DO UPDATE SET
      api_key = excluded.api_key,
      updated_at = excluded.updated_at
  `).run(session.user.id, provider, normalizedKey, now, now)

  return { success: true }
}
