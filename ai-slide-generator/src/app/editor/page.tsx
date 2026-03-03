import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function EditorPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      {/* Sidebar - Placeholder */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-sm uppercase text-gray-400">Слайддар</h2>
        </div>
        <div className="p-4 space-y-4">
           <div className="aspect-video bg-gray-100 rounded border border-gray-300"></div>
           <div className="aspect-video bg-gray-100 rounded border border-gray-200"></div>
        </div>
      </div>

      {/* Main Canvas - Placeholder */}
      <div className="flex-1 overflow-auto p-12 flex justify-center items-start">
        <div className="w-full max-w-4xl aspect-video bg-white shadow-2xl border border-gray-100 flex items-center justify-center relative">
           <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Жаңы презентация</h1>
              <p className="text-gray-400">Слайддын мазмуну бул жерде болот</p>
           </div>
        </div>
      </div>

      {/* Toolbar - Placeholder */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex-shrink-0">
         <h2 className="font-semibold mb-6">Настройкалар</h2>
         <div className="space-y-6">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Тема</label>
               <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option>Minimalist White</option>
                  <option>Modern Dark</option>
               </select>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
               Экспорт (.pptx)
            </button>
         </div>
      </div>
    </div>
  )
}
