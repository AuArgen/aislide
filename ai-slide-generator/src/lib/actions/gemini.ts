'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateSlides, generateOutline, generateSingleSlide } from '@/lib/gemini'
import { createPresentation } from '@/lib/actions/user'
import { getSettingByKey } from '@/lib/actions/settings'
import { revalidatePath } from 'next/cache'
import { saveAiLog, updateAiLog } from '@/lib/actions/logs'
import { getCurrentSession } from '@/lib/auth/auth-helpers'

export async function generateAndSavePresentation(userId: string, prompt: string, slideCount: number = 5, tone: string = 'business') {
  // 1. Create initial log
  const logId = await saveAiLog({
    user_id: userId,
    prompt: `Generate presentation: ${prompt}`,
    client_prompt: prompt,
    is_valid: false
  })

  try {
    // 2. Generate content using Gemini
    const { content: presentationContent, metadata } = await generateSlides(prompt, slideCount, tone)

    // 2.5 Resolve stock images if any
    if (presentationContent && presentationContent.slides) {
      const { getRandomStockImage } = await import('@/lib/images')
      
      for (const slide of presentationContent.slides) {
        // Resolve slide background
        if (slide.background && slide.background.startsWith('stock:')) {
          const query = slide.background.replace('stock:', '').trim()
          const imageUrl = await getRandomStockImage(query)
          if (imageUrl) {
            slide.background = imageUrl
            // Also update the rich bg object if it exists
            if (slide.bg) {
              slide.bg.type = 'image'
              slide.bg.value = imageUrl
            }
          }
        }

        // Resolve element images
        if (slide.elements) {
          for (const el of slide.elements) {
            if (el.type === 'image' && el.src && el.src.startsWith('stock:')) {
              const query = el.src.replace('stock:', '').trim()
              el.stockQuery = query // Save original query for regeneration
              const imageUrl = await getRandomStockImage(query)
              if (imageUrl) {
                el.src = imageUrl
              }
            }
          }
        }
      }
    }

    // 3. Save to database
    const result = await createPresentation(
      userId,
      presentationContent.title || prompt,
      presentationContent.slides,
      'default'
    )

    const successResult = result as { success: true; data: any }

    if (successResult.success && successResult.data) {
      // 4. Update log with full details
      if (logId) {
        await updateAiLog(logId, {
          presentation_id: successResult.data.id,
          full_prompt: metadata.fullPrompt,
          is_valid: metadata.isValid,
          response: metadata.rawResponse,
          tokens_used: metadata.tokensUsed,
          cost_usd: Number(metadata.costUsd.toFixed(6)),
          duration_ms: metadata.durationMs
        })
      }

      revalidatePath('/dashboard')
      return { success: true, id: successResult.data.id }
    } else {
      const errorStr = (result as any).error || 'Failed to save presentation'
      if (logId) {
        await updateAiLog(logId, {
          response: `Error: ${errorStr}`,
          is_valid: false
        })
      }
      return { success: false, error: errorStr }
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

    // Ар дайым логту жаңыртуу (ката болсо дагы)
    if (logId) {
      await updateAiLog(logId, {
        response: `Error: ${errorMessage}`,
        is_valid: false,
        tokens_used: partialMetadata?.tokensUsed || 0,
        cost_usd: Number((partialMetadata?.costUsd || 0).toFixed(6)),
        duration_ms: partialMetadata?.durationMs || 0
      }).catch(err => console.error('Failed to update error log:', err))
    }

    return { success: false, error: errorMessage }
  }
}

export async function generateOutlineAction(prompt: string, slideCount: number = 5, tone: string = 'business', audience: string = 'General', customApiKey?: string) {
  const session = await getCurrentSession()
  let logId: string | null = null

  if (session) {
    logId = await saveAiLog({
      user_id: session.user.id,
      prompt: `Generate outline: ${prompt}`,
      client_prompt: prompt,
      is_valid: false
    })
  }

  try {
    const { content: outline, metadata } = await generateOutline(prompt, slideCount, tone, audience, customApiKey)
    
    if (logId) {
      await updateAiLog(logId, {
        full_prompt: metadata.fullPrompt,
        is_valid: metadata.isValid,
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

    if (logId) {
      await updateAiLog(logId, {
        response: `Error: ${errorMessage}`,
        is_valid: false,
        tokens_used: partialMetadata?.tokensUsed || 0,
        cost_usd: Number((partialMetadata?.costUsd || 0).toFixed(6)),
        duration_ms: partialMetadata?.durationMs || 0
      }).catch(err => console.error('Failed to update error log for outline:', err))
    }

    return { success: false, error: errorMessage }
  }
}

export async function generateSingleSlideAction(outlineItem: any, colorTheme: string, customApiKey?: string) {
  const session = await getCurrentSession()
  let logId: string | null = null

  if (session) {
    logId = await saveAiLog({
      user_id: session.user.id,
      prompt: `Generate single slide: ${outlineItem.title}`,
      client_prompt: outlineItem.title + ': ' + outlineItem.coreMessage,
      is_valid: false
    })
  }

  try {
    const { content: slide, metadata } = await generateSingleSlide(outlineItem, colorTheme, customApiKey)
    
    // 2. Resolve stock images if any
    if (slide) {
      const { getRandomStockImage } = await import('@/lib/images')
      
      // Resolve slide background
      if (slide.background && slide.background.startsWith('stock:')) {
        const query = slide.background.replace('stock:', '').trim()
        const imageUrl = await getRandomStockImage(query)
        if (imageUrl) {
          slide.background = imageUrl
        }
      }

      // Resolve element images
      if (slide.elements) {
        for (const el of slide.elements) {
          if (el.type === 'image' && el.src && el.src.startsWith('stock:')) {
            const query = el.src.replace('stock:', '').trim()
            el.stockQuery = query // Save original query for regeneration
            const imageUrl = await getRandomStockImage(query)
            if (imageUrl) {
              el.src = imageUrl
            }
          }
        }
      }
    }

    if (logId) {
      await updateAiLog(logId, {
        full_prompt: metadata.fullPrompt,
        is_valid: metadata.isValid,
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

    if (logId) {
      await updateAiLog(logId, {
        response: `Error: ${errorMessage}`,
        is_valid: false,
        tokens_used: partialMetadata?.tokensUsed || 0,
        cost_usd: Number((partialMetadata?.costUsd || 0).toFixed(6)),
        duration_ms: partialMetadata?.durationMs || 0
      }).catch(err => console.error('Failed to update error log for single slide:', err))
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

    const session = await getCurrentSession()
    let logId: string | null = null
    if (session) {
      logId = await saveAiLog({
        user_id: session.user.id,
        prompt: `Text AI (${mode}): ${text.substring(0, 100)}...`,
        client_prompt: text,
        is_valid: true
      })
    }

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

    if (logId) {
      await updateAiLog(logId, {
        full_prompt: prompt,
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
