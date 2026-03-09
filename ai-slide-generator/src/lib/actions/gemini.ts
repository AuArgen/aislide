'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateSlides, generateOutline, generateSingleSlide } from '@/lib/gemini'
import { createPresentation } from '@/lib/actions/user'
import { getSettingByKey } from '@/lib/actions/settings'
import { revalidatePath } from 'next/cache'

export async function generateAndSavePresentation(userId: string, prompt: string, slideCount: number = 5, tone: string = 'business') {
  try {
    // 1. Generate content using Gemini
    const presentationContent = await generateSlides(prompt, slideCount, tone)

    // 2. Save to database
    const result = await createPresentation(
      userId,
      presentationContent.title || prompt,
      presentationContent.slides,
      'default'
    )

    const successResult = result as { success: true; data: any }

    if (successResult.success && successResult.data) {
      revalidatePath('/dashboard')
      return { success: true, id: successResult.data.id }
    } else {
      return { success: false, error: (result as any).error }
    }
  } catch (error: any) {
    console.error('Action Error:', error)
    return { success: false, error: error.message || 'Генерация учурунда ката кетти' }
  }
}

export async function generateOutlineAction(prompt: string, slideCount: number = 5, tone: string = 'business', audience: string = 'General') {
  try {
    const outline = await generateOutline(prompt, slideCount, tone, audience)
    return { success: true, data: outline }
  } catch (error: any) {
    console.error('Outline Action Error:', error)
    return { success: false, error: error.message || 'Планды түзүүдө ката кетти' }
  }
}

export async function generateSingleSlideAction(outlineItem: any, colorTheme: string) {
  try {
    const slide = await generateSingleSlide(outlineItem, colorTheme)
    return { success: true, data: slide }
  } catch (error: any) {
    console.error('Single Slide Action Error:', error)
    return { success: false, error: error.message || 'Слайдды түзүүдө ката кетти' }
  }
}

// ─── AI Text Assistant ─────────────────────────────────────────────────────────

type TextAiMode = 'summarize' | 'expand' | 'grammar' | 'rewrite'

const TEXT_AI_PROMPTS: Record<TextAiMode, string> = {
  summarize: 'Кыскартуу: Берилген текстти кыска жана так формага келтир. Негизги маанини гана сакта. Жооп — тек тексттин өзү (эч кандай аталыш же чоочун пикир жок).',
  expand: 'Кеңейтүү: Берилген текстти толуктаары менен кеңейт — деталдар, мисалдар же контекст кош. Жооп — тек тексттин өзү (эч кандай аталыш же чоочун пикир жок).',
  grammar: 'Грамматиканы оңдоо: Берилген тексттеги бардык грамматика, орфография жана пунктуация каталарын оңдо. Стилди же мазмунду өзгөртпө. Жооп — тек оңдолгон текст (эч кандай аталыш же чоочун пикир жок).',
  rewrite: 'Профессионалдык жазуу: Берилген текстти профессионалдык, ишкер тилде кайра жаз. Мазмунду сакта, бирок дараметин жогорулат. Жооп — тек тексттин өзү (эч кандай аталыш же чоочун пикир жок).',
}

export async function textAiAction(text: string, mode: TextAiMode): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    let apiKey = await getSettingByKey('GEMINI_API_KEY')
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { success: false, error: 'Gemini API key is not configured' }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `${TEXT_AI_PROMPTS[mode]}\n\nТекст:\n${text}`
    const result = await model.generateContent(prompt)
    const response = await result.response
    const output = response.text().trim()

    return { success: true, result: output }
  } catch (error: any) {
    console.error('textAiAction error:', error)
    return { success: false, error: error.message || 'AI ката кетти' }
  }
}
