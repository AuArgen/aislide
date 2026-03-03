'use client'

import { useState } from 'react'
import { updateSetting } from '@/lib/actions/settings'

interface SettingsFormProps {
  initialSettings: Record<string, string>
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const results = await Promise.all(
        Object.entries(settings).map(([key, value]) => updateSetting(key, value))
      )

      if (results.every(r => r.success)) {
        setMessage({ type: 'success', text: 'Жөндөөлөр ийгиликтүү сакталды!' })
      } else {
        setMessage({ type: 'error', text: 'Айрым жөндөөлөр сакталган жок.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ката кетти. Кайра аракет кылыңыз.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gemini API Key
          </label>
          <input
            type="password"
            value={settings['GEMINI_API_KEY'] || ''}
            onChange={(e) => handleChange('GEMINI_API_KEY', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="AI генерация үчүн ачкыч"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unsplash Access Key
          </label>
          <input
            type="password"
            value={settings['UNSPLASH_ACCESS_KEY'] || ''}
            onChange={(e) => handleChange('UNSPLASH_ACCESS_KEY', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Сүрөттөр үчүн ачкыч"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin QR Code URL
          </label>
          <input
            type="text"
            value={settings['ADMIN_QR_CODE'] || ''}
            onChange={(e) => handleChange('ADMIN_QR_CODE', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Төлөм үчүн QR-код шилтемеси"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Card Details
          </label>
          <input
            type="text"
            value={settings['ADMIN_CARD_INFO'] || ''}
            onChange={(e) => handleChange('ADMIN_CARD_INFO', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Карта номери жана аты-жөнү"
          />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Сакталууда...' : 'Жөндөөлөрдү сактоо'}
      </button>
    </form>
  )
}
