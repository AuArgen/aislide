import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { db } from '@/lib/db'
import LogTable from '@/components/admin/LogTable'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/')
  }

  const googleId = session.user.user_metadata.google_id
  const user = db.prepare('SELECT role FROM users WHERE google_id = ?').get(googleId) as { role: string } | undefined

  if (user?.role !== 'admin') {
    redirect('/dashboard')
  }

  const rawLogs = db.prepare(`
    SELECT l.*, u.full_name, u.email
    FROM ai_logs l
    LEFT JOIN users u ON l.user_id = u.id
    ORDER BY l.created_at DESC
    LIMIT 100
  `).all() as any[]

  const logs = rawLogs.map(({ full_name, email, is_valid, ...log }) => ({
    ...log,
    is_valid: !!is_valid,
    users: { full_name, email },
  }))

  const totalCost = logs.reduce((acc, log) => acc + (log.cost_usd || 0), 0)
  const totalTokens = logs.reduce((acc, log) => acc + (log.tokens_used || 0), 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Logs</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Жалпы сурамдар (Акыркы 100)</p>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Жалпы чыгым</p>
          <p className="text-2xl font-bold text-red-600">${totalCost.toFixed(4)}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Колдонулган токендер</p>
          <p className="text-2xl font-bold text-blue-600">{totalTokens.toLocaleString()}</p>
        </div>
      </div>

      <LogTable logs={logs} />
    </div>
  )
}
