import { getSettingByKey } from '@/lib/actions/settings'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import UpgradeForm from '@/components/user/UpgradeForm'
import { redirect } from 'next/navigation'

export default async function UpgradePage() {
  const session = await getCurrentSession()
  
  if (!session) {
    redirect('/')
  }

  const adminQrCode = await getSettingByKey('ADMIN_QR_CODE') || ''
  const adminCardInfo = await getSettingByKey('ADMIN_CARD_INFO') || ''

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Тарифти тандоо</h1>
          <p className="text-lg text-gray-600">Бардык мүмкүнчүлүктөрдү ачуу үчүн Premium тарифине кошулуңуз</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Free Plan Card */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 flex flex-col">
            <h3 className="text-xl font-bold mb-2">Акысыз (Free)</h3>
            <p className="text-3xl font-bold mb-6">0 сом <span className="text-sm text-gray-400 font-normal">/ айына</span></p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-2">✅ AI менен текст түзүү</li>
              <li className="flex items-center gap-2">✅ 3 презентацияга чейин</li>
              <li className="flex items-center gap-2 text-gray-400">❌ PowerPoint (.pptx) экспорт</li>
              <li className="flex items-center gap-2 text-gray-400">❌ Жогорку сапаттагы сүрөттөр</li>
            </ul>
            <button disabled className="w-full py-3 bg-gray-100 text-gray-400 rounded-lg font-bold">
              Учурдагы тариф
            </button>
          </div>

          {/* Premium Plan Card */}
          <div className="bg-white p-8 rounded-2xl border-2 border-blue-600 flex flex-col relative overflow-hidden shadow-xl shadow-blue-100">
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-bold rounded-bl-xl">
              Сунушталат
            </div>
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="text-3xl font-bold mb-6">500 сом <span className="text-sm text-gray-400 font-normal">/ айына</span></p>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-center gap-2">✅ Чексиз AI генерация</li>
              <li className="flex items-center gap-2">✅ Чексиз презентациялар</li>
              <li className="flex items-center gap-2">✅ PowerPoint жана PDF экспорт</li>
              <li className="flex items-center gap-2">✅ Unsplash Premium сүрөттөрү</li>
              <li className="flex items-center gap-2">✅ Приоритеттүү колдоо</li>
            </ul>
            <a href="#payment-form" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-center hover:bg-blue-700 transition-all">
              Premium'га өтүү
            </a>
          </div>
        </div>

        <div id="payment-form" className="pt-8">
          <UpgradeForm 
            userId={session.user.id} 
            adminQrCode={adminQrCode} 
            adminCardInfo={adminCardInfo} 
          />
        </div>
      </div>
    </div>
  )
}
