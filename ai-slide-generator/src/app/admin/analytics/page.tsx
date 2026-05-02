import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { db } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const EVENT_LABELS: Record<string, string> = {
  ai_generate_presentation: 'AI: презентация',
  ai_generate_slide: 'AI: слайд',
  ai_edit_text: 'AI: текст',
  user_add_slide: 'Колдонуучу: кошту',
  user_delete_slide: 'Колдонуучу: өчүрдү',
  user_duplicate_slide: 'Колдонуучу: көчүрдү',
}

export default async function AdminAnalyticsPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/')

  const googleId = session.user.user_metadata.google_id
  const user = db.prepare('SELECT role FROM users WHERE google_id = ?').get(googleId) as { role: string } | undefined
  if (user?.role !== 'admin') redirect('/dashboard')

  // Summary totals
  const summary = db.prepare(`
    SELECT
      COUNT(DISTINCT presentation_id) as total_presentations,
      COUNT(*) as total_events,
      SUM(total_tokens) as total_tokens,
      SUM(cost_usd) as total_cost
    FROM presentation_events
  `).get() as any

  // Per-presentation breakdown
  const presentations = db.prepare(`
    SELECT
      pe.presentation_id,
      p.title,
      u.full_name,
      u.email,
      COUNT(*) as event_count,
      SUM(CASE WHEN pe.event_type LIKE 'ai_%' THEN pe.total_tokens ELSE 0 END) as ai_tokens,
      SUM(pe.cost_usd) as total_cost,
      SUM(CASE WHEN pe.event_type = 'ai_generate_presentation' THEN 1 ELSE 0 END) as ai_pres_count,
      SUM(CASE WHEN pe.event_type = 'ai_generate_slide' THEN 1 ELSE 0 END) as ai_slide_count,
      SUM(CASE WHEN pe.event_type = 'ai_edit_text' THEN 1 ELSE 0 END) as ai_text_count,
      SUM(CASE WHEN pe.event_type LIKE 'user_%' THEN 1 ELSE 0 END) as user_action_count,
      MIN(pe.created_at) as created_at,
      MAX(pe.created_at) as last_activity
    FROM presentation_events pe
    LEFT JOIN presentations p ON pe.presentation_id = p.id
    LEFT JOIN users u ON pe.user_id = u.id
    GROUP BY pe.presentation_id
    ORDER BY MAX(pe.created_at) DESC
    LIMIT 100
  `).all() as any[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Презентация Аналитикасы</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Презентациялар</p>
          <p className="text-2xl font-bold">{summary?.total_presentations ?? 0}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Жалпы окуялар</p>
          <p className="text-2xl font-bold text-blue-600">{summary?.total_events ?? 0}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">AI Токендер</p>
          <p className="text-2xl font-bold text-purple-600">
            {((summary?.total_tokens ?? 0) as number).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Жалпы чыгым</p>
          <p className="text-2xl font-bold text-red-600">
            ${((summary?.total_cost ?? 0) as number).toFixed(4)}
          </p>
        </div>
      </div>

      {/* Presentations table */}
      {presentations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">
          Азырынча маалымат жок. Презентация жасалгандан кийин бул жерде чыгат.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Аталышы / Колдонуучу</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">AI операциялар</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Колдонуучу иши</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">AI Токендер</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Чыгым</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Акыркы активдик</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {presentations.map((pres) => (
                <tr key={pres.presentation_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">
                      {pres.title || 'Аталышсыз'}
                    </p>
                    <p className="text-gray-400 text-xs">{pres.full_name || pres.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      {pres.ai_pres_count > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                          <span className="text-gray-600">{pres.ai_pres_count}× жаратылды</span>
                        </span>
                      )}
                      {pres.ai_slide_count > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                          <span className="text-gray-600">{pres.ai_slide_count}× слайд AI</span>
                        </span>
                      )}
                      {pres.ai_text_count > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          <span className="text-gray-600">{pres.ai_text_count}× текст AI</span>
                        </span>
                      )}
                      {pres.ai_pres_count === 0 && pres.ai_slide_count === 0 && pres.ai_text_count === 0 && (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {pres.user_action_count > 0 ? `${pres.user_action_count} иш` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-800">
                    {pres.ai_tokens > 0 ? pres.ai_tokens.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-600">
                    {pres.total_cost > 0 ? `$${pres.total_cost.toFixed(5)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    {pres.last_activity
                      ? new Date(pres.last_activity).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/analytics/${pres.presentation_id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                      Толук →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
