import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/')
  }

  const googleId = session.user.user_metadata.google_id

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('google_id', googleId)
    .single()

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
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Настройкалар</h2>
        <p className="text-sm text-gray-500">Бул жерден системалык параметрлерди өзгөртө аласыз.</p>
      </div>
    </div>
  )
}
