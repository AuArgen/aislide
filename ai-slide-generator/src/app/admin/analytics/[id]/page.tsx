import { redirect, notFound } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { db } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  ai_generate_presentation: { label: 'AI: Презентация жаратылды', color: 'bg-purple-100 text-purple-700' },
  ai_generate_slide: { label: 'AI: Слайд жаратылды', color: 'bg-blue-100 text-blue-700' },
  ai_edit_text: { label: 'AI: Текст өзгөртүлдү', color: 'bg-cyan-100 text-cyan-700' },
  user_add_slide: { label: 'Колдонуучу: Слайд кошту', color: 'bg-green-100 text-green-700' },
  user_delete_slide: { label: 'Колдонуучу: Слайд өчүрдү', color: 'bg-red-100 text-red-700' },
  user_duplicate_slide: { label: 'Колдонуучу: Слайд көчүрдү', color: 'bg-yellow-100 text-yellow-700' },
}

export default async function PresentationAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getCurrentSession()
  if (!session) redirect('/')

  const googleId = session.user.user_metadata.google_id
  const user = db.prepare('SELECT role FROM users WHERE google_id = ?').get(googleId) as { role: string } | undefined
  if (user?.role !== 'admin') redirect('/dashboard')

  const { id } = await params

  const presentation = db.prepare(`
    SELECT p.*, u.full_name, u.email
    FROM presentations p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(id) as any

  if (!presentation) notFound()

  const events = db.prepare(`
    SELECT * FROM presentation_events
    WHERE presentation_id = ?
    ORDER BY created_at ASC
  `).all(id) as any[]

  // Per-event-type summary
  const tokenSummary = db.prepare(`
    SELECT
      event_type,
      COUNT(*) as count,
      SUM(input_tokens) as input_tokens,
      SUM(output_tokens) as output_tokens,
      SUM(total_tokens) as total_tokens,
      SUM(cost_usd) as cost_usd
    FROM presentation_events
    WHERE presentation_id = ? AND total_tokens > 0
    GROUP BY event_type
    ORDER BY SUM(total_tokens) DESC
  `).all(id) as any[]

  const totalTokens = events.reduce((s, e) => s + (e.total_tokens || 0), 0)
  const totalCost = events.reduce((s, e) => s + (e.cost_usd || 0), 0)

  // Find the initial generation event for per-slide estimates
  const genEvent = events.find(e => e.event_type === 'ai_generate_presentation')
  const genMeta = genEvent?.metadata ? JSON.parse(genEvent.metadata) : null

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/analytics" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Аналитика тизмеси
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-1">{presentation.title || 'Аталышсыз презентация'}</h1>
      <p className="text-gray-400 text-sm mb-6">
        {presentation.full_name || presentation.email} · Түзүлгөн: {new Date(presentation.created_at).toLocaleString('ru-RU')}
      </p>

      {/* Token summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Бардык окуялар</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">AI Токендер (жалпы)</p>
          <p className="text-2xl font-bold text-purple-600">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Жалпы чыгым</p>
          <p className="text-2xl font-bold text-red-600">${totalCost.toFixed(5)}</p>
        </div>
        {genMeta && (
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <p className="text-gray-500 text-sm">Слайдга болжолдуу токен</p>
            <p className="text-2xl font-bold text-blue-600">
              ~{(genMeta.estimated_tokens_per_slide || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ~${(genMeta.estimated_cost_per_slide || 0).toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Token breakdown by type */}
      {tokenSummary.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold mb-3 text-gray-700">AI Операциялар бойунча токен</h2>
          <div className="space-y-2">
            {tokenSummary.map((row) => {
              const label = EVENT_LABELS[row.event_type]?.label || row.event_type
              const pct = totalTokens > 0 ? (row.total_tokens / totalTokens) * 100 : 0
              return (
                <div key={row.event_type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label} ×{row.count}</span>
                    <span className="font-mono text-gray-800">
                      {row.total_tokens.toLocaleString()} токен · ${row.cost_usd.toFixed(5)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full event timeline */}
      <h2 className="font-semibold text-gray-700 mb-3">Толук тарых</h2>
      <div className="space-y-2">
        {events.map((event, i) => {
          const meta = event.event_type === 'ai_generate_presentation' && event.metadata
            ? JSON.parse(event.metadata) : null
          const badge = EVENT_LABELS[event.event_type] || { label: event.event_type, color: 'bg-gray-100 text-gray-600' }
          const isAi = event.event_type.startsWith('ai_')
          return (
            <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                    {event.slide_index !== null && (
                      <span className="text-xs text-gray-400">Слайд #{event.slide_index + 1}</span>
                    )}
                    {event.slide_count !== null && (
                      <span className="text-xs text-gray-400">/ {event.slide_count} слайд</span>
                    )}
                  </div>
                  {event.prompt && (
                    <p className="text-sm text-gray-600 truncate" title={event.prompt}>
                      "{event.prompt}"
                    </p>
                  )}
                  {meta && (
                    <p className="text-xs text-gray-400 mt-1">
                      Болжолдуу слайдга: ~{meta.estimated_tokens_per_slide?.toLocaleString()} токен
                      / ~${meta.estimated_cost_per_slide?.toFixed(6)}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {isAi && event.total_tokens > 0 && (
                    <>
                      <p className="font-mono text-sm font-medium text-purple-700">
                        {event.total_tokens.toLocaleString()} токен
                      </p>
                      <p className="text-xs text-gray-400">
                        {event.input_tokens.toLocaleString()} in · {event.output_tokens.toLocaleString()} out
                      </p>
                      <p className="text-xs text-red-500 font-mono">${event.cost_usd.toFixed(6)}</p>
                      {event.duration_ms > 0 && (
                        <p className="text-xs text-gray-300">{(event.duration_ms / 1000).toFixed(1)}с</p>
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(event.created_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'medium' })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        {events.length === 0 && (
          <div className="text-center text-gray-400 py-12 bg-white border border-gray-200 rounded-lg">
            Бул презентация үчүн маалымат жок
          </div>
        )}
      </div>
    </div>
  )
}
