'use client'

import { useState } from 'react'
import { createSubscription } from '@/lib/actions/payments'
import { useRouter } from 'next/navigation'

interface UpgradeFormProps {
  userId: string
  adminQrCode: string
  adminCardInfo: string
}

export default function UpgradeForm({ userId, adminQrCode, adminCardInfo }: UpgradeFormProps) {
  const [loading, setLoading] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proofUrl) {
      setMessage({ type: 'error', text: 'Сураныч, төлөм чегинин шилтемесин же файлды жүктөңүз.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await createSubscription(userId, 'premium', proofUrl)
      if (result.success) {
        setMessage({ type: 'success', text: 'Төлөм сурамы жөнөтүлдү! Админ текшергенден кийин жазылууңуз активдешет.' })
        setTimeout(() => router.push('/dashboard'), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Ката кетти, кайра аракет кылыңыз.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Тармактык ката кетти.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-center">Premium Тарифке өтүү</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-2">QR-код менен төлөө</h3>
          {adminQrCode ? (
            <div className="bg-white p-2 rounded-lg inline-block mb-2">
               {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={adminQrCode} alt="QR Code" className="w-32 h-32" />
            </div>
          ) : (
            <p className="text-sm text-blue-700">QR-код убактылуу жеткиликсиз</p>
          )}
          <p className="text-xs text-blue-600">Каалаган банк колдонмосунан сканерлеңиз</p>
        </div>

        <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-100">
          <h3 className="font-bold text-indigo-900 mb-2">Картага которуу</h3>
          <p className="text-lg font-mono font-bold text-indigo-700 mb-2">
            {adminCardInfo || 'Маалымат жок'}
          </p>
          <p className="text-xs text-indigo-600">Которуудан кийин чекти сактап алыңыз</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Төлөм чегинин шилтемеси (Google Drive, Dropbox же сүрөт хостинг)
          </label>
          <input
            type="text"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="https://example.com/my-receipt.jpg"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            * Убактылуу файл жүктөө функциясы иштелип жатат, шилтеме колдонуңуз.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-lg font-bold text-white transition-all shadow-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
        >
          {loading ? 'Жөнөтүлүүдө...' : 'Төлөмдү тастыктоого жөнөтүү'}
        </button>
      </form>
    </div>
  )
}
