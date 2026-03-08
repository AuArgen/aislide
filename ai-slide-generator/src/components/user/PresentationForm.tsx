'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateOutlineAction, generateSingleSlideAction } from '@/lib/actions/gemini'
import { createPresentation } from '@/lib/actions/user'

interface PresentationFormProps {
  userId: string
  canGenerate: boolean
}

export function PresentationForm({ userId, canGenerate }: PresentationFormProps) {
  const [prompt, setPrompt] = useState('')
  const [slideCount, setSlideCount] = useState(5)
  const [tone, setTone] = useState('business')
  const [targetAudience, setTargetAudience] = useState('General')
  const [colorTheme, setColorTheme] = useState('Modern Dark')

  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [totalSteps, setTotalSteps] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt) return

    setIsGenerating(true)
    setError(null)
    setCurrentStep('План түзүлүүдө (слайддардын структурасы)...')
    setProgress(0)
    setTotalSteps(1) // Outline represents step 0

    try {
      // Phase 1: Generate Outline
      const outlineResult = await generateOutlineAction(prompt, slideCount, tone, targetAudience)
      if (!outlineResult.success || !outlineResult.data) {
        throw new Error(outlineResult.error || 'План түзүүдө ката кетти')
      }

      const outline = outlineResult.data
      setTotalSteps(outline.length)

      // Phase 2: Generate Individual Slides
      const slides = []
      for (let i = 0; i < outline.length; i++) {
        setCurrentStep(`${i + 1}-слайд түзүлүүдө (${outline.length} ичинен)...`)
        setProgress(i) // i slides completed
        
        const slideItem = outline[i]
        const slideResult = await generateSingleSlideAction(slideItem, colorTheme)
        
        if (!slideResult.success || !slideResult.data) {
          throw new Error(slideResult.error || `${i + 1}-слайдды түзүүдө ката кетти`)
        }
        
        slides.push(slideResult.data)
      }

      setProgress(outline.length)
      setCurrentStep('Сакталууда...')

      // Phase 3: Finalize and Save
      const presentationTitle = outline[0]?.title || prompt
      const result = await createPresentation(userId, presentationTitle, slides, 'default')

      if (result.success && (result as any).data?.id) {
        router.push(`/editor/${(result as any).data.id}`)
      } else {
        throw new Error((result as any).error || 'Сактоо учурунда ката кетти')
      }
    } catch (err: any) {
      setError(err.message || 'Сервер менен байланышта ката кетти')
      setIsGenerating(false)
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

  const progressPercentage = totalSteps > 0 && isGenerating ? Math.round((progress / totalSteps) * 100) : 0

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
            disabled={isGenerating}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
              disabled={isGenerating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Презентациянын стили (Тон)
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isGenerating}
            >
              <option value="business">Бизнес (Иштиктүү)</option>
              <option value="academic">Академиялык (Илимий)</option>
              <option value="creative">Креативдүү (Чыгармачыл)</option>
              <option value="school">Мектеп (Окуучулар үчүн)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Максаттуу аудитория
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isGenerating}
            >
              <option value="General">Жалпы эл үчүн</option>
              <option value="Students">Студенттер / Окуучулар</option>
              <option value="Investors">Инвесторлор</option>
              <option value="Children">Балдар үчүн</option>
              <option value="Professionals">Профессионалдар</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Түстөр темасы (Color Theme)
            </label>
            <select
              value={colorTheme}
              onChange={(e) => setColorTheme(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isGenerating}
            >
              <option value="Modern Dark">Modern Dark (Заманбап күңүрт)</option>
              <option value="Corporate Blue">Corporate Blue (Корпоративдик көк)</option>
              <option value="Creative Pastel">Creative Pastel (Креативдүү пастел)</option>
              <option value="Minimalist Light">Minimalist Light (Минималист жарык)</option>
              <option value="Vibrant Warm">Vibrant Warm (Ачык жылуу)</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isGenerating || !prompt}
            className={`w-full py-4 bg-blue-600 text-white rounded-xl font-bold transition-all ${
              isGenerating || !prompt ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {currentStep}
                </span>
                <div className="w-64 h-2 bg-blue-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300 rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            ) : (
              '✨ AI менен түзүү'
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-4 rounded-xl border border-red-100">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
