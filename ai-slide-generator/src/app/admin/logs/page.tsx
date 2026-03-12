import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
      <div className="flexItems-center justify-between mb-6">
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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50 flex">
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Колдонуучу</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-2/5">Сурам / Жооп</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Метрика</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Убакыт</div>
          </div>
          <div className="bg-white divide-y divide-gray-200">
            {error ? (
              <div className="p-6 text-red-500">Маалыматты жүктөөдө ката кетти.</div>
            ) : !logs || logs.length === 0 ? (
              <div className="p-6 text-gray-500 text-center">Сурамдар табылган жок.</div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex hover:bg-gray-50">
                  <div className="px-6 py-4 w-1/5">
                    <p className="text-sm font-medium text-gray-900 truncate">{log.users?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500 truncate">{log.users?.email}</p>
                  </div>
                  <div className="px-6 py-4 w-2/5">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Prompt:</span>
                      <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded mt-1 line-clamp-2" title={log.prompt}>
                        {log.prompt}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Response:</span>
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 border border-gray-200 line-clamp-3">
                        {log.response || '(Жок)'}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 w-1/5">
                    <div className="flex flex-col gap-1 text-sm">
                      <p><span className="text-gray-500">Токен:</span> {log.tokens_used.toLocaleString()}</p>
                      <p><span className="text-gray-500">Чыгым:</span> <span className="text-red-600">${log.cost_usd.toFixed(6)}</span></p>
                      <p><span className="text-gray-500">Убакыт:</span> {(log.duration_ms / 1000).toFixed(1)} сек</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 w-1/5 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
