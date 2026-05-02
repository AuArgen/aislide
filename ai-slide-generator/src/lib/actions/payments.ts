'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { sendTelegramNotification } from '@/lib/telegram'
import { randomUUID } from 'node:crypto'

export async function createSubscription(
  userId: string,
  planType: 'free' | 'premium',
  paymentProofUrl: string,
) {
  const id = randomUUID()
  const now = new Date().toISOString()

  try {
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan_type, status, payment_proof_url, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?)
    `).run(id, userId, planType, paymentProofUrl, now, now)

    const user = db.prepare('SELECT full_name, email FROM users WHERE id = ?').get(userId) as any
    const message = `
🔔 <b>Жаңы төлөм сурамы!</b>
👤 Колдонуучу: ${user?.full_name || 'Белгисиз'}
📧 Email: ${user?.email || 'Жок'}
💎 Тариф: ${planType.toUpperCase()}
🔗 <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/payments">Админ панелден текшерүү</a>
    `.trim()

    await sendTelegramNotification(message)
    return { success: true, data: { id }, error: undefined }
  } catch (err: any) {
    console.error('Error creating subscription:', err)
    return { success: false, error: err?.message ?? 'Unknown error', data: undefined }
  }
}

export async function getPendingPayments() {
  const rows = db.prepare(`
    SELECT s.*, u.full_name, u.email
    FROM subscriptions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.status = 'pending'
    ORDER BY s.created_at DESC
  `).all() as any[]

  return rows.map(({ full_name, email, ...sub }) => ({
    ...sub,
    users: { full_name, email },
  }))
}

export async function updatePaymentStatus(
  subscriptionId: string,
  status: 'active' | 'rejected',
) {
  const now = new Date().toISOString()
  const fields: string[] = ['status = ?', 'updated_at = ?']
  const values: any[] = [status, now]

  if (status === 'active') {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    fields.push('start_date = ?', 'end_date = ?', 'expires_at = ?')
    values.push(startDate.toISOString(), endDate.toISOString(), endDate.toISOString())
  }

  try {
    values.push(subscriptionId)
    db.prepare(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    revalidatePath('/admin/payments')
    return { success: true }
  } catch (err: any) {
    console.error('Error updating payment status:', err)
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}
