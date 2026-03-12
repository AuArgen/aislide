'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function saveAiLog(data: {
  user_id: string
  presentation_id?: string | null
  prompt: string
  response: string
  tokens_used: number
  cost_usd: number
  duration_ms: number
}) {
  const supabase = createAdminClient()
  try {
    // @ts-ignore
    const { error } = await supabase.from('ai_logs').insert([data])
    
    // Эгер таблица кэште жок болсо (жаңы түзүлгөндө), схеманы жаңыртып кайра аракет кылабыз
    if (error && error.code === 'PGRST205') {
      console.log('Schema cache stale detected. Attempting to reload...')
      
      try {
        await supabase.rpc('reload_schema')
      } catch (rpcErr) {
        // Эгер функция жок болсо же ката кетсе
      }
      
      // Бир аз күтүп кайра аракет кылабыз
      await new Promise(resolve => setTimeout(resolve, 800))
      // @ts-ignore
      const { error: retryError } = await supabase.from('ai_logs').insert([data])
      if (retryError) {
        console.error('Failed to save AI log after schema reload:', retryError)
      }
    } else if (error) {
      console.error('Failed to save AI log to database:', error)
    }
  } catch (err) {
    console.error('Failed to save AI log (exception):', err)
  }
}
