import Link from 'next/link'
import { getCurrentSession, getUserByGoogleId } from '@/lib/auth/auth-helpers'
import { getUserSubscription, getUserPresentations } from '@/lib/actions/user'
import { PresentationForm } from '@/components/user/PresentationForm'

export default async function DashboardPage() {
  const session = await getCurrentSession()

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Кирүү керек</h1>
        <Link href="/" className="text-blue-600 hover:underline">Башкы бетке кайтуу</Link>
      </div>
    )
  }

  const googleId = session.user.user_metadata.google_id
  const fullName = session.user.user_metadata.full_name || session.user.email.split('@')[0]

  const user = await getUserByGoogleId(googleId)

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Колдонуучу табылган жок</h1>
      </div>
    )
  }

  const subscription = await getUserSubscription(user.id)
  const presentations = await getUserPresentations(user.id)

  const isPremium = subscription?.status === 'active'
  const isPending = subscription?.status === 'pending'

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Жеке кабинет</h1>
            <p className="text-gray-500">Кош келиңиз, {fullName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${
              isPremium ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
            }`}>
              Статус: {isPremium ? 'Premium' : isPending ? 'Күтүүдө...' : 'Free'}
            </div>
            {!isPremium && !isPending && (
              <Link
                href="/dashboard/upgrade"
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
              >
                Тарифти көтөрүү
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <PresentationForm userId={user.id} canGenerate={isPremium} />

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Менин презентацияларым</h3>
              {presentations.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 border border-gray-100 rounded-3xl">
                  <p className="text-gray-400">Сизде азырынча презентациялар жок.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presentations.map((p) => (
                    <Link
                      key={p.id}
                      href={`/editor/${p.id}`}
                      className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                    >
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                        {p.title}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleDateString('ky-KG')}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">Статистика</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-700">Түзүлгөн слайддар:</span>
                  <span className="font-bold">{presentations.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-700">Жүктөлгөн PPTX:</span>
                  <span className="font-bold">0</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
              <h3 className="text-lg font-bold mb-4">Жардам</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Презентация түзүү үчүн темаңызды жазып, AI баскычын басыңыз. 
                Даяр болгон слайддарды редактордон өзгөртө аласыз.
              </p>
              <Link href="#" className="text-sm text-blue-600 font-bold hover:underline">
                Нускаманы окуу →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
