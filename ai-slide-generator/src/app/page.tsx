import Link from 'next/link'
import { LoginButton } from '@/components/auth/LoginButton'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full">
            AI менен презентация түзүү
          </span>
          <h1 className="text-6xl font-extrabold text-gray-900 mb-8 tracking-tight">
            Кесипкөй слайддарды <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              секунда ичинде
            </span> түзүңүз
          </h1>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Google Gemini AI жардамы менен презентацияңыздын мазмунун автоматтык түрдө түзүп, 
            аны PowerPoint же PDF форматында жүктөп алыңыз.
          </p>

          <div className="flex gap-4 justify-center items-center">
            {session ? (
              <Link 
                href="/dashboard" 
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5"
              >
                Башкы бетке өтүү
              </Link>
            ) : (
              <>
                <LoginButton />
                <button className="px-8 py-4 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-200">
                  Кененирээк билүү
                </button>
              </>
            )}
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div className="relative group p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 font-bold group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Генерация</h3>
              <p className="text-gray-500 leading-relaxed">
                Темаңызды жазыңыз, калганын Gemini 1.5 Pro жасайт. Слайддын түзүмүн жана мазмунун иреттейт.
              </p>
            </div>

            <div className="relative group p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-6 font-bold group-hover:scale-110 transition-transform">
                🎨
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Заманбап Дизайн</h3>
              <p className="text-gray-500 leading-relaxed">
                Даяр шаблондор жана темалар. Бардык слайддар таза ак фондо жана минималисттик стилде.
              </p>
            </div>

            <div className="relative group p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-2xl mb-6 font-bold group-hover:scale-110 transition-transform">
                📂
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Экспорт жана Бөлүшүү</h3>
              <p className="text-gray-500 leading-relaxed">
                Бир чыкылдатуу менен .pptx же PDF жүктөп алыңыз. Же шилтеме аркылуу башкалар менен бөлүшүңүз.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
