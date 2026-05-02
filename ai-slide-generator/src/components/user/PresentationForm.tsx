'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateOutlineAction, generateSingleSlideAction } from '@/lib/actions/gemini'
import { createPresentation } from '@/lib/actions/user'

const STORAGE_KEY = 'user_gemini_api_key'

const TEMPLATES = [
  {
    id: "html_dark_professional",
    name: "Dark Professional",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_dark_professional_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "business", audience: "Professionals", colorTheme: "Modern Dark" }
  },
  {
    id: "html_academic",
    name: "Academic",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_academic_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "academic", audience: "Students", colorTheme: "Minimalist Light" }
  },
  {
    id: "html_pure_minimal",
    name: "Pure Minimal",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_pure_minimal_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "business", audience: "General", colorTheme: "Minimalist Light" }
  },
  {
    id: "html_rational_blue",
    name: "Rational Blue",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_rational_blue_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "business", audience: "Investors", colorTheme: "Corporate Blue" }
  },
  {
    id: "html_contemporary_academic",
    name: "Contemporary Academic",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_contemporary_academic_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "academic", audience: "Professionals", colorTheme: "Corporate Blue" }
  },
  {
    id: "html_warm_neutral_venture",
    name: "Warm Neutral",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_warm_neutral_venture_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "business", audience: "Investors", colorTheme: "Vibrant Warm" }
  },
  {
    id: "html_electric_pop",
    name: "Electric Pop",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_electric_pop_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "creative", audience: "Students", colorTheme: "Vibrant Warm" }
  },
  {
    id: "html_botanical",
    name: "Botanical",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_botanical_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "creative", audience: "General", colorTheme: "Creative Pastel" }
  },
  {
    id: "html_memphis",
    name: "Memphis",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_memphis_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "creative", audience: "General", colorTheme: "Creative Pastel" }
  },
  {
    id: "html_wabi_sabi",
    name: "Wabi-Sabi",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_wabi_sabi_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "creative", audience: "General", colorTheme: "Creative Pastel" }
  },
  {
    id: "html_cinematic_minimal",
    name: "Cinematic Minimal",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_cinematic_minimal_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "creative", audience: "General", colorTheme: "Modern Dark" }
  },
  {
    id: "html_8_bit_pixel",
    name: "8-bit Pixel",
    thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_8_bit_pixel_en_01.jpg?x-oss-process=image/resize,w_300",
    payload: { tone: "school", audience: "Children", colorTheme: "Vibrant Warm" }
  }
];

interface PresentationFormProps {
  userId: string
  canGenerate: boolean
}

export function PresentationForm({ userId, canGenerate }: PresentationFormProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id)
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false)
  
  const [slideCount, setSlideCount] = useState<number | string>(5)
  const [customApiKey, setCustomApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [totalSteps, setTotalSteps] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setCustomApiKey(stored)
  }, [])

  const handleApiKeyChange = (value: string) => {
    setCustomApiKey(value)
    localStorage.setItem(STORAGE_KEY, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt || !selectedTemplateId) return

    setIsGenerating(true)
    setError(null)
    setCurrentStep('План түзүлүүдө (слайддардын структурасы)...')
    setProgress(0)
    setTotalSteps(1)

    try {
      const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0]
      const { tone, audience: targetAudience, colorTheme } = template.payload

      const finalSlideCount = typeof slideCount === 'number' ? slideCount : 5
      const outlineResult = await generateOutlineAction(prompt, finalSlideCount, tone, targetAudience, customApiKey || undefined)
      if (!outlineResult.success || !outlineResult.data) {
        throw new Error(outlineResult.error || 'План түзүүдө ката кетти')
      }

      const outline = outlineResult.data
      setTotalSteps(outline.length)

      const slides = []
      for (let i = 0; i < outline.length; i++) {
        setCurrentStep(`${i + 1}-слайд түзүлүүдө (${outline.length} ичинен)...`)
        setProgress(i) // i slides completed
        
        const slideItem = outline[i]
        const slideResult = await generateSingleSlideAction(slideItem, colorTheme, customApiKey || undefined)
        
        if (!slideResult.success || !slideResult.data) {
          throw new Error(slideResult.error || `${i + 1}-слайдды түзүүдө ката кетти`)
        }
        
        slides.push(slideResult.data)
      }

      setProgress(outline.length)
      setCurrentStep('Сакталууда...')

      const presentationTitle = outline[0]?.title || prompt
      const hasCustomKey = !!customApiKey.trim()
      const result = await createPresentation(userId, presentationTitle, slides, 'default', hasCustomKey)

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
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Блок А: Негизги Текст талаасы */}
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none min-h-[160px] text-lg resize-y custom-scroll"
            placeholder="Презентацияңыздын темасын же идеясын жазыңыз... (Мисалы: Жасалма интеллекттин келечеги)"
            disabled={isGenerating}
            required
          />
        </div>

        {/* Блок Б: Визуалдык Стилдер Галереясы */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Визуалдык стилди тандаңыз</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-96 overflow-y-auto px-1 -mx-1 custom-scroll">
            {TEMPLATES.map((template) => {
              const isSelected = selectedTemplateId === template.id
              return (
                <div
                  key={template.id}
                  onClick={() => !isGenerating && setSelectedTemplateId(template.id)}
                  className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-500 ring-4 ring-blue-50' 
                      : 'border-gray-100 hover:border-gray-200 opacity-80 hover:opacity-100'
                  } ${isGenerating ? 'pointer-events-none' : ''}`}
                >
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={template.thumbnail} 
                      alt={template.name} 
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 text-center text-sm font-medium ${isSelected ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700'}`}>
                    {template.name}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Блок В: Кошумча жөндөөлөр */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium outline-none"
          >
            <span>⚙️ Кошумча жөндөөлөр</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isAdvancedSettingsOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isAdvancedSettingsOpen && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Слайддардын саны
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={slideCount}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') {
                      setSlideCount('')
                      return
                    }
                    const parsed = parseInt(val)
                    if (!isNaN(parsed)) {
                      setSlideCount(parsed)
                    }
                  }}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isGenerating}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini API Key (Милдеттүү эмес)
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={customApiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className="w-full px-4 py-2 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    placeholder="AIza..."
                    disabled={isGenerating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Акысыз лимиттер бүткөндө гана колдонуңуз.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Баскыч жана Ката */}
        <div>
          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
              {error}
            </p>
          )}
          
          <button
            type="submit"
            disabled={isGenerating || !prompt || !selectedTemplateId}
            className={`w-full py-4 bg-blue-600 text-white rounded-xl font-bold transition-all shadow-md ${
              isGenerating || !prompt || !selectedTemplateId 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5'
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
      </form>
    </div>
  )
}

