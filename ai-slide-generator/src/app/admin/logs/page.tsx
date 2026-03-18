import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LogTable from '@/components/admin/LogTable'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/')
  }

  const googleId = session.user.user_metadata.google_id

  const supabaseServer = await createClient()
  const { data: user } = await supabaseServer
    .from('users')
    .select('role')
    .eq('google_id', googleId)
    .single()

  if ((user as any)?.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabaseAdmin = createAdminClient()
  
  const { data: logs, error } = await supabaseAdmin
    .from('ai_logs')
    .select(`
      *,
      users:user_id ( full_name, email )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate totals
  const totalCost = logs?.reduce((acc, log: any) => acc + (log.cost_usd || 0), 0) || 0
  const totalTokens = logs?.reduce((acc, log: any) => acc + (log.tokens_used || 0), 0) || 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Logs (Gemini)</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Жалпы сурамдар (Акыркы 100)</p>
          <p className="text-2xl font-bold">{logs?.length || 0}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Жалпы чыгым</p>
          <p className="text-2xl font-bold text-red-600">${totalCost.toFixed(4)}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Колдонулган টокендер</p>
          <p className="text-2xl font-bold text-blue-600">{totalTokens.toLocaleString()}</p>
        </div>
      </div>

      <LogTable logs={logs || []} />
    </div>
  )
}
