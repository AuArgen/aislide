/**
 * Server-only: DB-dependent user helpers.
 * Do NOT import this file in client components.
 */
import { db } from '@/lib/db'
import type { User } from '@/types/auth'
import { randomUUID } from 'node:crypto'

export function getUserByGoogleId(googleId: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId) as unknown as User | undefined
  return row ?? null
}

export function upsertUser(user: Partial<User>): User | null {
  if (!user.google_id) return null
  const now = new Date().toISOString()

  const existing = db
    .prepare('SELECT id FROM users WHERE google_id = ?')
    .get(user.google_id) as unknown as { id: string } | undefined

  if (existing) {
    db.prepare(`
      UPDATE users SET
        email      = COALESCE(?, email),
        full_name  = COALESCE(?, full_name),
        avatar_url = COALESCE(?, avatar_url),
        role       = COALESCE(?, role),
        last_login = COALESCE(?, last_login)
      WHERE google_id = ?
    `).run(
      user.email ?? null,
      user.full_name ?? null,
      user.avatar_url ?? null,
      user.role ?? null,
      user.last_login ?? null,
      user.google_id,
    )
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(user.google_id) as unknown as User
  }

  const id = randomUUID()
  db.prepare(`
    INSERT INTO users (id, google_id, email, full_name, avatar_url, role, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    user.google_id!,
    user.email ?? '',
    user.full_name ?? '',
    user.avatar_url ?? null,
    user.role ?? 'user',
    now,
    user.last_login ?? null,
  )
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as User
}
