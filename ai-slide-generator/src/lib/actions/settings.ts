'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
  return db.prepare('SELECT * FROM settings').all()
}

export async function updateSetting(key: string, value: string) {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key.toLowerCase(), value, now, now)
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function getSettingByKey(key: string) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key.toLowerCase()) as { value: string } | undefined
  return row ? row.value : null
}
