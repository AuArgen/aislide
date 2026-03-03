'use server'

import { supabase } from '@/lib/supabase/client'

export async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }

  return data
}

export async function getUserPresentations(userId: string) {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching presentations:', error)
    return []
  }

  return data
}

export async function createPresentation(userId: string, title: string, slides: any, theme: string = 'default') {
  const { data, error } = await supabase
    .from('presentations')
    .insert({
      user_id: userId,
      title,
      slides,
      theme,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating presentation:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getPresentationById(id: string) {
  const { data, error } = await supabase
    .from('presentations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching presentation:', id, error)
    return null
  }

  return data
}

export async function updatePresentation(id: string, updates: any) {
  const { error } = await supabase
    .from('presentations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating presentation:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
