'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { generateOutlineAction, generateSingleSlideAction } from '@/lib/actions/gemini'
import { createPresentation } from '@/lib/actions/user'
import { useT } from '@/components/shared/LanguageProvider'
import Link from 'next/link'

const STORAGE_KEY = 'user_gemini_api_key'

const TEMPLATES = [
  { id: "html_dark_professional", name: "Dark Professional", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_dark_professional_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "business", audience: "Professionals", colorTheme: "Modern Dark" } },
  { id: "html_academic", name: "Academic", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_academic_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "academic", audience: "Students", colorTheme: "Minimalist Light" } },
  { id: "html_pure_minimal", name: "Pure Minimal", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_pure_minimal_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "business", audience: "General", colorTheme: "Minimalist Light" } },
  { id: "html_rational_blue", name: "Rational Blue", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_rational_blue_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "business", audience: "Investors", colorTheme: "Corporate Blue" } },
  { id: "html_contemporary_academic", name: "Contemporary Academic", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_contemporary_academic_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "academic", audience: "Professionals", colorTheme: "Corporate Blue" } },
  { id: "html_warm_neutral_venture", name: "Warm Neutral", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_warm_neutral_venture_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "business", audience: "Investors", colorTheme: "Vibrant Warm" } },
  { id: "html_electric_pop", name: "Electric Pop", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_electric_pop_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "creative", audience: "Students", colorTheme: "Vibrant Warm" } },
  { id: "html_botanical", name: "Botanical", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_botanical_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "creative", audience: "General", colorTheme: "Creative Pastel" } },
  { id: "html_memphis", name: "Memphis", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_memphis_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "creative", audience: "General", colorTheme: "Creative Pastel" } },
  { id: "html_wabi_sabi", name: "Wabi-Sabi", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_wabi_sabi_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "creative", audience: "General", colorTheme: "Creative Pastel" } },
  { id: "html_cinematic_minimal", name: "Cinematic Minimal", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_cinematic_minimal_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "creative", audience: "General", colorTheme: "Modern Dark" } },
  { id: "html_8_bit_pixel", name: "8-bit Pixel", thumbnail: "https://kimi-img.moonshot.cn/pub/slides/slides-styles/html_8_bit_pixel_en_01.jpg?x-oss-process=image/resize,w_300", payload: { tone: "school", audience: "Children", colorTheme: "Vibrant Warm" } },
]

interface PresentationFormProps {
  userId: string
  canGenerate: boolean
}

export function PresentationForm({ userId, canGenerate }: PresentationFormProps) {
  const t = useT()
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setCustomApiKey(stored)
    textareaRef.current?.focus()
  }, [])

  const handleApiKeyChange = (value: string) => {
    setCustomApiKey(value)
    localStorage.setItem(STORAGE_KEY, value)
  }

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!prompt || !selectedTemplateId) return

    setIsGenerating(true)
    setError(null)
    setCurrentStep(t('form.stepOutline'))
    setProgress(0)
    setTotalSteps(1)

    try {
      const template = TEMPLATES.find(tmpl => tmpl.id === selectedTemplateId) || TEMPLATES[0]
      const { tone, audience: targetAudience, colorTheme } = template.payload

      const finalSlideCount = typeof slideCount === 'number' ? slideCount : 5
      const outlineResult = await generateOutlineAction(prompt, finalSlideCount, tone, targetAudience, customApiKey || undefined)
      if (!outlineResult.success || !outlineResult.data) {
        throw new Error(outlineResult.error || t('form.stepOutline'))
      }

      const outline = outlineResult.data
      setTotalSteps(outline.length)

      const slides = []
      for (let i = 0; i < outline.length; i++) {
        setCurrentStep(t('form.stepSlide', { n: i + 1, total: outline.length }))
        setProgress(i)

        const slideItem = outline[i]
        const slideResult = await generateSingleSlideAction(slideItem, colorTheme, customApiKey || undefined)

        if (!slideResult.success || !slideResult.data) {
          throw new Error(slideResult.error || t('form.stepSlide', { n: i + 1, total: outline.length }))
        }

        slides.push(slideResult.data)
      }

      setProgress(outline.length)
      setCurrentStep(t('form.stepSaving'))

      const presentationTitle = outline[0]?.title || prompt
      const hasCustomKey = !!customApiKey.trim()
      const result = await createPresentation(userId, presentationTitle, slides, 'default', hasCustomKey)

      if (result.success && (result as any).data?.id) {
        router.push(`/editor/${(result as any).data.id}`)
      } else {
        throw new Error((result as any).error || t('form.errorServer'))
      }
    } catch (err: any) {
      setError(err.message || t('form.errorServer'))
      setIsGenerating(false)
    }
  }

  const progressPercentage = totalSteps > 0 && isGenerating ? Math.round((progress / totalSteps) * 100) : 0

  if (!canGenerate) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 py-20 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{t('form.notPremium')}</h3>
        <Link
          href="/dashboard/upgrade"
          className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
        >
          {t('form.upgradePlan')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('form.title')}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t('form.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none min-h-[140px] text-base resize-y transition-all"
            placeholder={t('form.placeholder')}
            disabled={isGenerating}
            required
          />
          {prompt.length > 0 && (
            <span className="absolute bottom-3 right-4 text-xs text-gray-400">
              {prompt.length}
            </span>
          )}
        </div>

        {/* Template Gallery */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            {t('form.selectStyle')}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto pr-1 custom-scroll">
            {TEMPLATES.map((template) => {
              const isSelected = selectedTemplateId === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => !isGenerating && setSelectedTemplateId(template.id)}
                  disabled={isGenerating}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-150 text-left ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
                      : 'border-gray-100 hover:border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={`px-2 py-1.5 text-center text-xs font-medium truncate ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-600'
                  }`}>
                    {template.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('form.advancedSettings')}
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdvancedSettingsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isAdvancedSettingsOpen && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('form.slideCount')}
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={slideCount}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') { setSlideCount(''); return }
                    const parsed = parseInt(val)
                    if (!isNaN(parsed)) setSlideCount(parsed)
                  }}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('form.apiKey')}
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim() || !selectedTemplateId}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            isGenerating || !prompt.trim() || !selectedTemplateId
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5'
          }`}
        >
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3">
              <span className="flex items-center gap-2.5">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {currentStep}
              </span>
              <div className="w-full max-w-xs h-1.5 bg-blue-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('form.generate')}
            </span>
          )}
        </button>
      </form>
    </div>
  )
}
