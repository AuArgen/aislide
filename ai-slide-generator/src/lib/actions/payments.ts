'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { sendTelegramNotification } from '@/lib/telegram'

export async function createSubscription(userId: string, planType: 'free' | 'premium', paymentProofUrl: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_type: planType,
      status: 'pending',
      payment_proof_url: paymentProofUrl,
    })
    .select('*, users(full_name, email)')
    .single()

  if (error) {
    console.error('Error creating subscription:', error)
    return { success: false, error: error.message }
  }

  // Send Telegram Notification to Admin
  const user = (data as any).users
  const message = `
🔔 <b>Жаңы төлөм сурамы!</b>
👤 Колдонуучу: ${user?.full_name || 'Белгисиз'}
📧 Email: ${user?.email || 'Жок'}
💎 Тариф: ${planType.toUpperCase()}
🔗 <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/payments">Админ панелден текшерүү</a>
  `.trim()

  await sendTelegramNotification(message)

  return { success: true, data }
}

export async function getPendingPayments() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      users (
        full_name,
        email
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    return []
  }

  return data
}

export async function updatePaymentStatus(subscriptionId: string, status: 'active' | 'rejected') {
  const updateData: any = { status, updated_at: new Date().toISOString() }
  
  if (status === 'active') {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription
    
    updateData.start_date = startDate.toISOString()
    updateData.end_date = endDate.toISOString()
    updateData.expires_at = endDate.toISOString()
  }

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('id', subscriptionId)

  if (error) {
    console.error('Error updating payment status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/payments')
  return { success: true }
}
