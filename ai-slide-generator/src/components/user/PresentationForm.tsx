'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { generateOutlineAction, generateSingleSlideAction } from '@/lib/actions/gemini'
import { createPresentation } from '@/lib/actions/user'
import { useT, useLanguage } from '@/components/shared/LanguageProvider'
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

const GEMINI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    tagKey: 'form.modelFast' as const,
    tagColor: 'bg-emerald-100 text-emerald-700',
    desc: { ky: 'Тез жана үнөмдүү. Көпчүлүк презентациялар үчүн идеал. Арзан баа.', ru: 'Быстрая и эффективная. Идеальна для большинства. Низкая стоимость.', en: 'Fast and cost-efficient. Ideal for most presentations. Low cost.' },
    icon: '⚡',
    badge: null,
  },
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    tagKey: 'form.modelBalanced' as const,
    tagColor: 'bg-blue-100 text-blue-700',
    desc: { ky: 'Жаңы муун. Чоң моделдерге теңелген сапат, арзан баада. Татаал темалар үчүн.', ru: 'Новое поколение. Качество топ-моделей по доступной цене. Для сложных тем.', en: 'New generation. Frontier-class performance at a fraction of the cost.' },
    icon: '🚀',
    badge: 'NEW',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    tagKey: 'form.modelPowerful' as const,
    tagColor: 'bg-purple-100 text-purple-700',
    desc: { ky: 'Татаал иштер үчүн. Терең ой жүгүртүү жана деталдуу структура. Баасы жогору.', ru: 'Для сложных задач. Глубокое мышление и детальная структура. Выше стоимость.', en: 'For complex tasks. Deep reasoning and detailed structure. Higher cost.' },
    icon: '🧠',
    badge: null,
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    tagKey: 'form.modelPowerful' as const,
    tagColor: 'bg-violet-100 text-violet-700',
    desc: { ky: 'Эң акыркы жана эң күчтүү. Максималдуу сапат. Эң жогорку баа.', ru: 'Новейший и самый мощный. Максимальное качество. Самая высокая стоимость.', en: 'Latest and most powerful. Maximum quality. Highest cost.' },
    icon: '👑',
    badge: 'NEW',
  },
] as const

type GeminiModelId = typeof GEMINI_MODELS[number]['id']

type WizardStep = 'input' | 'outline' | 'generating'

interface OutlineItem {
  slideNumber: number
  title: string
  coreMessage: string
  suggestedVisual: string
}

interface AttachedFile {
  id: string
  name: string
  type: 'image' | 'text' | 'document'
  content: string
  pages?: number
  chars?: number
  loading?: boolean
  parseError?: string
}

interface PresentationFormProps {
  userId: string
  canGenerate: boolean
}

export function PresentationForm({ userId, canGenerate }: PresentationFormProps) {
  const t = useT()
  const { language } = useLanguage()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<WizardStep>('input')
  const [prompt, setPrompt] = useState('')
  const [slideCount, setSlideCount] = useState(5)
  const [customApiKey, setCustomApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-2.5-flash')
  const [isLoadingOutline, setIsLoadingOutline] = useState(false)

  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id)
  const [imageDecisions, setImageDecisions] = useState<Array<{ filename: string; usage: 'background' | 'element' | 'context'; slideNumber?: number }>>([])


  const [currentStep, setCurrentStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [totalSteps, setTotalSteps] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'RATE_LIMIT' | 'INVALID_API_KEY' | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setCustomApiKey(stored)
    textareaRef.current?.focus()
  }, [])

  const handleApiKeyChange = (value: string) => {
    setCustomApiKey(value)
    localStorage.setItem(STORAGE_KEY, value)
    if (errorType) { setErrorType(null); setError(null) }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files?.length) return

    for (const file of Array.from(files)) {
      const id = Math.random().toString(36).slice(2)
      const nameLower = file.name.toLowerCase()

      if (file.type.startsWith('image/')) {
        setAttachedFiles(prev => [...prev, { id, name: file.name, type: 'image', content: '', loading: true }])
        const formData = new FormData()
        formData.append('image', file)
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          const data = await res.json()
          setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, content: data.url || file.name, loading: false } : f))
        } catch {
          setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, content: file.name, loading: false } : f))
        }
      } else if (nameLower.endsWith('.pdf') || nameLower.endsWith('.docx')) {
        setAttachedFiles(prev => [...prev, { id, name: file.name, type: 'document', content: '', loading: true }])
        const formData = new FormData()
        formData.append('file', file)
        try {
          const res = await fetch('/api/parse-document', { method: 'POST', body: formData })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Parse failed')
          }
          const data = await res.json()
          setAttachedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, content: data.text, pages: data.pages, chars: data.chars, loading: false } : f
          ))
        } catch (err: any) {
          setAttachedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, loading: false, parseError: err.message || 'Ошибка парсинга' } : f
          ))
        }
      } else {
        setAttachedFiles(prev => [...prev, { id, name: file.name, type: 'text', content: '', loading: true }])
        try {
          const text = await file.text()
          const sliced = text.slice(0, 15000)
          setAttachedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, content: sliced, chars: sliced.length, loading: false } : f
          ))
        } catch {
          setAttachedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, loading: false, parseError: 'Ошибка чтения' } : f
          ))
        }
      }
    }
  }

  const buildTextContext = (): string | undefined => {
    const textFiles = attachedFiles.filter(f => (f.type === 'text' || f.type === 'document') && f.content && !f.loading && !f.parseError)
    if (!textFiles.length) return undefined
    return textFiles.map(f => `[File "${f.name}"]:\n${f.content}`).join('\n\n---\n\n')
  }

  // Image files for AI to decide their usage
  const getImageFiles = () =>
    attachedFiles
      .filter(f => f.type === 'image' && f.content)
      .map(f => ({ filename: f.name, url: f.content }))

  const handleCreateOutline = async () => {
    if (!prompt.trim()) return
    setIsLoadingOutline(true)
    setError(null)

    try {
      const template = TEMPLATES.find(tmpl => tmpl.id === selectedTemplateId) || TEMPLATES[0]
      const imageFiles = getImageFiles()
      const result = await generateOutlineAction(
        prompt, slideCount,
        template.payload.tone, template.payload.audience,
        customApiKey || undefined,
        buildTextContext(),
        imageFiles.length ? imageFiles : undefined,
        selectedModel,
      )
      if (!result.success || !result.data) {
        const errCode = result.error as string
        if (errCode === 'RATE_LIMIT' || errCode === 'INVALID_API_KEY') {
          setErrorType(errCode)
          setIsAdvancedOpen(true)
        }
        throw new Error(errCode || t('form.errorServer'))
      }

      setOutline(result.data)
      setImageDecisions(result.imageDecisions ?? [])
      setExpandedIndex(0)
      setStep('outline')
    } catch (err: any) {
      setError(err.message || t('form.errorServer'))
    } finally {
      setIsLoadingOutline(false)
    }
  }

  const handleGenerate = async () => {
    setStep('generating')
    setError(null)
    setProgress(0)
    setTotalSteps(outline.length)

    try {
      const template = TEMPLATES.find(tmpl => tmpl.id === selectedTemplateId) || TEMPLATES[0]
      const slides = []

      for (let i = 0; i < outline.length; i++) {
        setCurrentStep(t('form.stepSlide', { n: i + 1, total: outline.length }))
        setProgress(i)
        const res = await generateSingleSlideAction(
          outline[i], template.payload.colorTheme,
          customApiKey || undefined,
          undefined,
          undefined,
          selectedModel,
        )
        if (!res.success || !res.data) {
          const errCode = res.error as string
          if (errCode === 'RATE_LIMIT' || errCode === 'INVALID_API_KEY') {
            setErrorType(errCode)
            setIsAdvancedOpen(true)
          }
          throw new Error(errCode || t('form.errorServer'))
        }
        slides.push(res.data)
      }

      // Apply AI image decisions
      for (const decision of imageDecisions) {
        const file = attachedFiles.find(f => f.name === decision.filename)
        if (!file || !file.content) continue

        if (decision.usage === 'background') {
          for (const slide of slides) {
            slide.bg = { type: 'image', value: file.content, overlayColor: '#000000', overlayOpacity: 0.35 }
            slide.background = file.content
          }
        } else if (decision.usage === 'element') {
          const idx = (decision.slideNumber ?? 1) - 1
          const target = slides[idx] ?? slides[0]
          if (target) {
            target.elements = target.elements ?? []
            target.elements.push({
              id: Math.random().toString(36).slice(2),
              type: 'image',
              src: file.content,
              x: 1080,
              y: 120,
              width: 720,
              height: 840,
            })
          }
        }
        // 'context' → no visual change
      }

      setProgress(outline.length)
      setCurrentStep(t('form.stepSaving'))

      const result = await createPresentation(
        userId, outline[0]?.title || prompt,
        slides, 'default', !!customApiKey.trim()
      )

      if (result.success && (result as any).data?.id) {
        router.push(`/editor/${(result as any).data.id}`)
      } else {
        throw new Error((result as any).error || t('form.errorServer'))
      }
    } catch (err: any) {
      setError(err.message || t('form.errorServer'))
      setStep('outline')
    }
  }

  const progressPct = totalSteps > 0 ? Math.round((progress / totalSteps) * 100) : 0

  // ── Not premium ─────────────────────────────────────────────────────────────
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

  // ── Step 3: Generating ───────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-8 py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-800 mb-1">{currentStep}</p>
        <p className="text-sm text-gray-400 mb-4">{outline[progress]?.title || ''}</p>
        <div className="w-72 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{progressPct}%</p>
        {error && errorType === 'RATE_LIMIT' && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm max-w-sm text-left space-y-2">
            <p className="text-amber-800 font-medium">{t('form.rateLimitError')}</p>
            <p className="text-amber-700">{t('form.rateLimitHint')}</p>
            <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t('form.getApiKey')}
            </a>
          </div>
        )}
        {error && !errorType && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 max-w-sm text-left">
            {error}
          </div>
        )}
      </div>
    )
  }

  // ── Step 2: Outline ──────────────────────────────────────────────────────────
  if (step === 'outline') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setStep('input')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('form.backToInput')}
          </button>
          <span className="text-gray-200">|</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{t('form.outlineReady')}</h1>
            <p className="text-gray-500 text-xs">{t('form.outlineSubtitle')}</p>
          </div>
        </div>

        {/* Style picker — horizontal scroll */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t('form.selectStyle')}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scroll">
            {TEMPLATES.map(template => {
              const isSel = selectedTemplateId === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`flex-shrink-0 relative rounded-xl overflow-hidden border-2 transition-all w-24 ${isSel ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-gray-100 hover:border-gray-300 opacity-80 hover:opacity-100'}`}
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                    {isSel && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={`px-1 py-1 text-center text-[9px] font-medium truncate ${isSel ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-500'}`}>
                    {template.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Accordion outline */}
        <div className="space-y-2 mb-5">
          {outline.map((item, index) => {
            const isOpen = expandedIndex === index
            return (
              <div
                key={index}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? 'border-blue-200 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
              >
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isOpen ? null : index)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate pr-2">
                    {item.title}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-4 pb-4 bg-blue-50/30 border-t border-blue-100 space-y-3 pt-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        {t('form.slideTitle')}
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => {
                          const updated = [...outline]
                          updated[index] = { ...updated[index], title: e.target.value }
                          setOutline(updated)
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        {t('form.coreMessage')}
                      </label>
                      <textarea
                        value={item.coreMessage}
                        onChange={e => {
                          const updated = [...outline]
                          updated[index] = { ...updated[index], coreMessage: e.target.value }
                          setOutline(updated)
                        }}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && errorType === 'RATE_LIMIT' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm mb-4 space-y-2">
            <p className="text-amber-800 font-medium">{t('form.rateLimitError')}</p>
            <p className="text-amber-700">{t('form.rateLimitHint')}</p>
            <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t('form.getApiKey')}
            </a>
          </div>
        )}
        {error && !errorType && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 mb-4">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCreateOutline}
            disabled={isLoadingOutline}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {isLoadingOutline ? (
              <svg className="animate-spin w-4 h-4 text-gray-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {t('form.regenerateOutline')}
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoadingOutline}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('form.generateFromOutline')}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 1: Input ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">{t('form.title')}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t('form.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {/* Textarea with attached-file bar */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full px-5 py-4 pb-14 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none min-h-[140px] text-base resize-y transition-all"
            placeholder={t('form.placeholder')}
            disabled={isLoadingOutline}
          />

          {/* Bottom toolbar inside textarea */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoadingOutline}
                title={t('form.attachFile')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {t('form.attachFile')}
              </button>
              {attachedFiles.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  {t('form.attachedFiles', { n: attachedFiles.length })}
                </span>
              )}
            </div>
            {prompt.length > 0 && (
              <span className="text-xs text-gray-400 pointer-events-none">{prompt.length}</span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,.txt,.md,.pdf,.docx"
            multiple
            className="hidden"
            onChange={e => { handleFileSelect(e.target.files); e.target.value = '' }}
          />
        </div>

        {/* Attached files chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map(file => {
              const ext = file.name.split('.').pop()?.toUpperCase() ?? ''
              const isPdf = ext === 'PDF'
              const isDocx = ext === 'DOCX'
              const isImage = file.type === 'image'
              const hasError = !!file.parseError

              const badgeColor = hasError
                ? 'bg-red-100 text-red-600'
                : isImage
                  ? 'bg-emerald-100 text-emerald-700'
                  : isPdf
                    ? 'bg-red-100 text-red-700'
                    : isDocx
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'

              const badgeLabel = hasError ? '!' : isImage ? 'IMG' : ext || 'TXT'

              const meta = file.loading
                ? 'читается...'
                : hasError
                  ? file.parseError
                  : file.pages
                    ? `${file.pages} стр.`
                    : file.chars
                      ? `${Math.round(file.chars / 1000)}K симв.`
                      : null

              return (
                <div
                  key={file.id}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs border ${hasError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
                >
                  {file.loading ? (
                    <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className={`inline-flex items-center justify-center rounded px-1 py-0.5 text-[10px] font-bold leading-none flex-shrink-0 ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                  )}
                  <span className="max-w-[110px] truncate text-gray-700 font-medium">{file.name}</span>
                  {meta && (
                    <span className={`text-[10px] flex-shrink-0 ${hasError ? 'text-red-500' : 'text-gray-400'}`}>
                      {meta}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachedFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-0.5 flex-shrink-0"
                    title={t('form.removeFile')}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Advanced Settings */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('form.advancedSettings')}
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isAdvancedOpen && (
            <div className="mt-4 flex flex-col gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">

              {/* Model selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.aiModel')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GEMINI_MODELS.map(m => {
                    const isSelected = selectedModel === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModel(m.id)}
                        disabled={isLoadingOutline}
                        className={`relative flex flex-col gap-1.5 text-left px-3 py-3 rounded-xl border-2 transition-all duration-150 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                        } disabled:opacity-50`}
                      >
                        {m.badge && (
                          <span className="absolute -top-2 -right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-500 text-white shadow-sm">
                            {m.badge}
                          </span>
                        )}
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-sm font-semibold text-gray-800 leading-tight">
                            {m.icon} {m.label}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full self-start ${m.tagColor}`}>
                          {t(m.tagKey)}
                        </span>
                        <p className="text-[11px] text-gray-500 leading-snug">
                          {m.desc[language as 'ky' | 'ru' | 'en'] ?? m.desc.en}
                        </p>
                        {isSelected && (
                          <span className="text-[10px] font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded self-start truncate max-w-full">
                            {m.id}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('form.slideCount')}
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={slideCount}
                  onChange={e => {
                    const v = parseInt(e.target.value)
                    if (!isNaN(v) && v >= 3 && v <= 15) setSlideCount(v)
                  }}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  disabled={isLoadingOutline}
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
                    onChange={e => handleApiKeyChange(e.target.value)}
                    className="w-full px-4 py-2 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    placeholder="AIza..."
                    disabled={isLoadingOutline}
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
                <a
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {t('form.getApiKey')}
                </a>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && errorType === 'RATE_LIMIT' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm space-y-2">
            <div className="flex items-start gap-2.5 text-amber-800 font-medium">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {t('form.rateLimitError')}
            </div>
            <p className="text-amber-700 pl-7">{t('form.rateLimitHint')}</p>
            <div className="pl-7">
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {t('form.getApiKey')}
              </a>
            </div>
          </div>
        )}
        {error && errorType === 'INVALID_API_KEY' && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('form.invalidApiKeyError')}
          </div>
        )}
        {error && !errorType && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Create Outline button */}
        <button
          type="button"
          onClick={handleCreateOutline}
          disabled={isLoadingOutline || !prompt.trim()}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            isLoadingOutline || !prompt.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5'
          }`}
        >
          {isLoadingOutline ? (
            <span className="flex items-center justify-center gap-2.5">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('form.stepOutline')}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              {t('form.createOutline')}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
