'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('settings')
    .select('*')

  if (error) {
    console.error('Error fetching settings:', error)
    return []
  }

  return data as any
}

export async function updateSetting(key: string, value: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('settings')
    .upsert({
      key: key.toLowerCase(),
      value,
      updated_at: new Date().toISOString()
    } as never)

  if (error) {
    console.error('Error updating setting:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function getSettingByKey(key: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key.toLowerCase())
    .maybeSingle()

  if (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }

  return data ? (data as any).value : null
}
