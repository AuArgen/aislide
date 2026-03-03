'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')

  if (error) {
    console.error('Error fetching settings:', error)
    return []
  }

  return data
}

export async function updateSetting(key: string, value: string) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) {
    console.error('Error updating setting:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function getSettingByKey(key: string) {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }

  return data.value
}
