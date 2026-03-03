'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateAndSavePresentation } from '@/lib/actions/gemini'

interface PresentationFormProps {
  userId: string
  canGenerate: boolean
}

export function PresentationForm({ userId, canGenerate }: PresentationFormProps) {
  const [prompt, setPrompt] = useState('')
  const [slideCount, setSlideCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await generateAndSavePresentation(userId, prompt, slideCount)
      if (result.success && result.id) {
        router.push(`/editor/${result.id}`)
      } else {
        setError(result.error || 'Күтүлбөгөн ката кетти')
      }
    } catch (err: any) {
      setError(err.message || 'Сервер менен байланышта ката кетти')
    } finally {
      setIsLoading(false)
    }
  }

  if (!canGenerate) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-2xl text-center">
        <p className="text-yellow-700 font-medium">
          Презентация түзүү үчүн жазылууңуз активдүү болушу керек.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Жаңы презентация түзүү</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Презентациянын темасы же кыскача мазмуну
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
            placeholder="Мисалы: Кыргызстандын тарыхы, Жасалма интеллекттин келечеги..."
            disabled={isLoading}
            required
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Слайддардын саны
            </label>
            <input
              type="number"
              min="3"
              max="15"
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isLoading}
            />
          </div>
          <div className="flex-[2] pt-6">
            <button
              type="submit"
              disabled={isLoading || !prompt}
              className={`w-full py-3 bg-blue-600 text-white rounded-xl font-bold transition-all ${
                isLoading || !prompt ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Генерацияланууда...
                </span>
              ) : (
                '✨ AI менен түзүү'
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
