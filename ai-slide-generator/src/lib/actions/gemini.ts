'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateSlides, generateOutline, generateSingleSlide } from '@/lib/gemini'
import { createPresentation } from '@/lib/actions/user'
import { getSettingByKey } from '@/lib/actions/settings'
import { revalidatePath } from 'next/cache'
import { saveAiLog } from '@/lib/actions/logs'
import { getCurrentSession } from '@/lib/auth/auth-helpers'

export async function generateAndSavePresentation(userId: string, prompt: string, slideCount: number = 5, tone: string = 'business') {
  try {
    // 1. Generate content using Gemini
    const { content: presentationContent, metadata } = await generateSlides(prompt, slideCount, tone)

    // 2. Save to database
    const result = await createPresentation(
      userId,
      presentationContent.title || prompt,
      presentationContent.slides,
      'default'
    )

    const successResult = result as { success: true; data: any }

    if (successResult.success && successResult.data) {
      await saveAiLog({
        user_id: userId,
        presentation_id: successResult.data.id,
        prompt: prompt,
        response: metadata.rawResponse,
        tokens_used: metadata.tokensUsed,
        cost_usd: Number(metadata.costUsd.toFixed(6)),
        duration_ms: metadata.durationMs
      })

      revalidatePath('/dashboard')
      return { success: true, id: successResult.data.id }
    } else {
      return { success: false, error: (result as any).error }
    }
  } catch (error: any) {
    console.error('Action Error:', error)
    
    let errorMessage = error.message || 'Генерация учурунда ката кетти'
    let partialMetadata = null

    try {
      const errObj = JSON.parse(error.message)
      errorMessage = errObj.message
      partialMetadata = errObj.partialMetadata
    } catch (e) {}

    // Ар дайым логко жазуу (токен жок болсо дагы)
    await saveAiLog({
      user_id: userId,
      presentation_id: null,
      prompt: `[ERROR] ${prompt.substring(0, 150)}`,
      response: `Error: ${errorMessage}`,
      tokens_used: partialMetadata?.tokensUsed || 0,
      cost_usd: Number((partialMetadata?.costUsd || 0).toFixed(6)),
      duration_ms: partialMetadata?.durationMs || 0
    }).catch(err => console.error('Failed to save error log:', err))

    return { success: false, error: errorMessage }
  }
}

export async function generateOutlineAction(prompt: string, slideCount: number = 5, tone: string = 'business', audience: string = 'General', customApiKey?: string) {
  try {
    const session = await getCurrentSession()
    const { content: outline, metadata } = await generateOutline(prompt, slideCount, tone, audience, customApiKey)
    
    if (session) {
      await saveAiLog({
        user_id: session.user.id,
        presentation_id: null,
        prompt: `Generate outline: ${prompt}`,
        response: metadata.rawResponse,
        tokens_used: metadata.tokensUsed,
        cost_usd: Number(metadata.costUsd.toFixed(6)),
        duration_ms: metadata.durationMs
      })
    }

    return { success: true, data: outline }
  } catch (error: any) {
    console.error('Outline Action Error:', error)

    let errorMessage = error.message || 'Планды түзүүдө ката кетти'
    let partialMetadata = null

    try {
      const errObj = JSON.parse(error.message)
      errorMessage = errObj.message
      partialMetadata = errObj.partialMetadata
    } catch (e) {}

    const session = await getCurrentSession()
    if (session) {
      await saveAiLog({
        user_id: session.user.id,
        presentation_id: null,
        prompt: `[ERROR Outline] ${prompt.substring(0, 150)}`,
        response: `Error: ${errorMessage}`,
        tokens_used: partialMetadata?.tokensUsed || 0,
        cost_usd: Number((partialMetadata?.costUsd || 0).toFixed(6)),
        duration_ms: partialMetadata?.durationMs || 0
      }).catch(err => console.error('Failed to save error log for outline:', err))
    }

    return { success: false, error: errorMessage }
  }
}

export async function generateSingleSlideAction(outlineItem: any, colorTheme: string, customApiKey?: string) {
  try {
    const session = await getCurrentSession()
    const { content: slide, metadata } = await generateSingleSlide(outlineItem, colorTheme, customApiKey)
    
    if (session) {
      await saveAiLog({
        user_id: session.user.id,
        presentation_id: null,
        prompt: `Generate single slide: ${outlineItem.title}`,
        response: metadata.rawResponse,
        tokens_used: metadata.tokensUsed,
        cost_usd: Number(metadata.costUsd.toFixed(6)),
        duration_ms: metadata.durationMs
      })
    }

    return { success: true, data: slide }
  } catch (error: any) {
    console.error('Single Slide Action Error:', error)
    
    let errorMessage = error.message || 'Слайдды түзүүдө ката кетти'
    let partialMetadata = null

    try {
      const errObj = JSON.parse(error.message)
      errorMessage = errObj.message
      partialMetadata = errObj.partialMetadata
    } catch (e) {}

    const session = await getCurrentSession()
    if (session) {
      await saveAiLog({
        user_id: session.user.id,
        presentation_id: null, 
        prompt: `[ERROR SingleSlide] ${outlineItem.title}`,
        response: `Error: ${errorMessage}`,
        tokens_used: partialMetadata?.tokensUsed || 0,
        cost_usd: Number((partialMetadata?.costUsd || 0).toFixed(6)),
        duration_ms: partialMetadata?.durationMs || 0
      }).catch(err => console.error('Failed to save error log for single slide:', err))
    }

    return { success: false, error: errorMessage }
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
    const startTime = performance.now()
    let apiKey = await getSettingByKey('GEMINI_API_KEY')
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { success: false, error: 'Gemini API key is not configured' }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `${TEXT_AI_PROMPTS[mode]}\n\nТекст:\n${text}`
    const result = await model.generateContent(prompt)
    const response = await result.response
    const output = response.text().trim()
    
    const durationMs = performance.now() - startTime
    const inputTokens = response.usageMetadata?.promptTokenCount || 0
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0
    const totalTokens = response.usageMetadata?.totalTokenCount || 0
    const costUsd = (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30

    const session = await getCurrentSession()
    if (session) {
      await saveAiLog({
        user_id: session.user.id,
        presentation_id: null,
        prompt: `Text AI (${mode}): ${text.substring(0, 100)}...`,
        response: output,
        tokens_used: totalTokens,
        cost_usd: Number(costUsd.toFixed(6)),
        duration_ms: Math.round(durationMs)
      })
    }

    return { success: true, result: output }
  } catch (error: any) {
    console.error('textAiAction error:', error)
    return { success: false, error: error.message || 'AI ката кетти' }
  }
}
