'use client'

import { useState } from 'react'
import { updateSetting } from '@/lib/actions/settings'

interface SettingsFormProps {
  initialSettings: Record<string, string>
}

const SETTINGS_FIELDS = [
  {
    key: 'GEMINI_API_KEY',
    label: 'Gemini API Key',
    type: 'password',
    placeholder: 'Google Gemini генерация үчүн ачкыч',
  },
  {
    key: 'OPENAI_API_KEY',
    label: 'OpenAI / ChatGPT API Key',
    type: 'password',
    placeholder: 'ChatGPT генерация үчүн ачкыч',
  },
  {
    key: 'UNSPLASH_ACCESS_KEY',
    label: 'Unsplash Access Key',
    type: 'password',
    placeholder: 'Сүрөттөр үчүн ачкыч',
  },
  {
    key: 'ADMIN_QR_CODE',
    label: 'Admin QR Code URL',
    type: 'text',
    placeholder: 'Төлөм үчүн QR-код шилтемеси',
  },
  {
    key: 'ADMIN_CARD_INFO',
    label: 'Admin Card Details',
    type: 'text',
    placeholder: 'Карта номери жана аты-жөнү',
  },
] as const

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(() => {
    const normalized: Record<string, string> = {}
    for (const field of SETTINGS_FIELDS) {
      normalized[field.key] = initialSettings[field.key] ?? initialSettings[field.key.toLowerCase()] ?? ''
    }
    return normalized
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const results = await Promise.all(
        SETTINGS_FIELDS.map(field => updateSetting(field.key, settings[field.key] ?? ''))
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
        {SETTINGS_FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              value={settings[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder={field.placeholder}
            />
          </div>
        ))}
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
