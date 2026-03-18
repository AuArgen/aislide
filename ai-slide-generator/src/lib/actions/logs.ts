'use server'

import { createAdminClient } from '@/lib/supabase/admin'

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
  const supabase = createAdminClient()
  try {
    // @ts-ignore
    const { data: insertedData, error } = await (supabase.from('ai_logs' as any) as any).insert([data]).select('id').single()
    
    if (error && error.code === 'PGRST205') {
      console.log('Schema cache stale detected. Attempting to reload...')
      try {
        await supabase.rpc('reload_schema')
      } catch (rpcErr) {}
      
      await new Promise(resolve => setTimeout(resolve, 800))
      // @ts-ignore
      const { data: retryData, error: retryError } = await (supabase.from('ai_logs' as any) as any).insert([data]).select('id').single()
      if (retryError) {
        console.error('Failed to save AI log after schema reload:', retryError)
        return null
      }
      return (retryData as any)?.id
    } else if (error) {
      console.error('Failed to save AI log to database:', error)
      return null
    }
    return (insertedData as any)?.id
  } catch (err) {
    console.error('Failed to save AI log (exception):', err)
    return null
  }
}

export async function updateAiLog(id: string, data: {
  presentation_id?: string | null
  response?: string | null
  is_valid?: boolean
  tokens_used?: number
  cost_usd?: number
  duration_ms?: number
  full_prompt?: string | null
}) {
  const supabase = createAdminClient()
  try {
    const { error } = await (supabase
      .from('ai_logs' as any) as any)
      .update(data)
      .eq('id', id)

    if (error) {
      console.error('Failed to update AI log:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Failed to update AI log (exception):', err)
    return false
  }
}
