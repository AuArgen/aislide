import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Activity } from 'lucide-react'

export default async function AdminPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/')
  }

  const googleId = session.user.user_metadata.google_id
  const user = db.prepare('SELECT role FROM users WHERE google_id = ?').get(googleId) as { role: string } | undefined

  if (user?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Админ Панель</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Бардык колдонуучулар</p>
          <p className="text-2xl font-bold italic">-</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Төлөм күткөндөр</p>
          <p className="text-2xl font-bold italic">-</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Активдүү жазылуулар</p>
          <p className="text-2xl font-bold italic">-</p>
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">Gemini Token Status</p>
          <p className="text-2xl font-bold text-green-600">Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Настройкалар</h2>
          <p className="text-sm text-gray-500 mb-4">Бул жерден системалык параметрлерди өзгөртө аласыз.</p>
          <Link href="/admin/settings" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">Көбүрөөк →</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-start">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600 mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="font-semibold mb-2">AI Метрикасы (Logs)</h2>
          <p className="text-sm text-gray-500 mb-4 flex-1">
            Gemini генерацияларынын тарыхын, сурамдарды, кеткен убакытты, токендерди жана чыгымды (USD) көзөмөлдөңүз.
          </p>
          <Link href="/admin/logs" className="text-purple-600 hover:text-purple-500 text-sm font-medium">Ачуу →</Link>
        </div>
      </div>
    </div>
  )
}
