'use server'

import { generateSlides } from '@/lib/gemini'
import { createPresentation } from '@/lib/actions/user'
import { revalidatePath } from 'next/cache'

export async function generateAndSavePresentation(userId: string, prompt: string, slideCount: number = 5) {
  try {
    // 1. Generate content using Gemini
    const presentationContent = await generateSlides(prompt, slideCount)

    // 2. Save to database
    const result = await createPresentation(
      userId,
      presentationContent.title || prompt,
      presentationContent.slides,
      'default'
    )

    if (result.success && result.data) {
      revalidatePath('/dashboard')
      return { success: true, id: result.data.id }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error('Action Error:', error)
    return { success: false, error: error.message || 'Генерация учурунда ката кетти' }
  }
}
