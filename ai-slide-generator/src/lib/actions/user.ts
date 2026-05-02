'use server'

import { db } from '@/lib/db'
import { getRoleLimits } from '@/lib/auth/limits'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'

function normalizePresentationData(pres: any) {
  if (!pres || !Array.isArray(pres.slides)) return pres

  let isLegacy = true
  for (const slide of pres.slides) {
    if (!Array.isArray(slide.elements)) continue
    for (const el of slide.elements) {
      if (
        (el.x !== undefined && el.x > 100) ||
        (el.y !== undefined && el.y > 100) ||
        (el.width !== undefined && el.width > 100) ||
        (el.height !== undefined && el.height > 100)
      ) {
        isLegacy = false
        break
      }
    }
    if (!isLegacy) break
  }

  if (!isLegacy) return pres

  const normalizedSlides = pres.slides.map((slide: any) => {
    if (!Array.isArray(slide.elements)) return slide
    return {
      ...slide,
      elements: slide.elements.map((el: any) => {
        const newEl = { ...el }
        if (typeof newEl.x === 'number') newEl.x = Math.round((newEl.x / 100) * 1920)
        if (typeof newEl.y === 'number') newEl.y = Math.round((newEl.y / 100) * 1080)
        if (typeof newEl.width === 'number') newEl.width = Math.round((newEl.width / 100) * 1920)
        if (typeof newEl.height === 'number') newEl.height = Math.round((newEl.height / 100) * 1080)
        return newEl
      }),
    }
  })

  return { ...pres, slides: normalizedSlides }
}

function parsePresentation(row: any) {
  if (!row) return null
  const slides = typeof row.slides === 'string' ? JSON.parse(row.slides) : row.slides
  return normalizePresentationData({ ...row, slides })
}

export async function getUserSubscription(userId: string) {
  const row = db
    .prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(userId)
  return row ?? null
}

export async function getUserPresentations(userId: string) {
  const rows = db
    .prepare('SELECT * FROM presentations WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId)
  return rows.map(parsePresentation)
}

export async function createPresentation(
  userId: string,
  title: string,
  slides: any,
  theme: string = 'default',
  hasCustomApiKey: boolean = false,
) {
  const userData = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any
  if (!userData) return { success: false, error: 'User not found' }

  const { count } = db
    .prepare('SELECT COUNT(*) as count FROM presentations WHERE user_id = ?')
    .get(userId) as { count: number }

  if (!hasCustomApiKey) {
    const { maxPresentations, label } = getRoleLimits(userData.role)
    if (count >= maxPresentations) {
      return {
        success: false,
        error: `Лимит ашылды. Сиздин тариф (${label}) боюнча максимум ${maxPresentations} презентация түзүүгө болот.`,
      }
    }
  }

  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO presentations (id, user_id, title, slides, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, userId, title, JSON.stringify(slides), theme, now, now)

  return { success: true, data: { id } }
}

export async function getPresentationById(id: string) {
  const row = db.prepare('SELECT * FROM presentations WHERE id = ?').get(id)
  return parsePresentation(row)
}

export async function updatePresentation(id: string, updates: any) {
  const fields: string[] = []
  const values: any[] = []

  if (updates.slides !== undefined) {
    fields.push('slides = ?')
    values.push(JSON.stringify(updates.slides))
  }
  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.theme !== undefined) {
    fields.push('theme = ?')
    values.push(updates.theme)
  }
  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  db.prepare(`UPDATE presentations SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return { success: true }
}

export async function deletePresentation(id: string) {
  db.prepare('DELETE FROM presentations WHERE id = ?').run(id)
  revalidatePath('/dashboard')
  return { success: true }
}
