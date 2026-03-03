import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSettingByKey } from '@/lib/actions/settings'

export async function generateSlides(prompt: string, slideCount: number = 5) {
  const apiKey = await getSettingByKey('GEMINI_API_KEY')

  if (!apiKey) {
    throw new Error('Gemini API key is not configured in settings')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const systemPrompt = `
    Сен презентация түзүүчү жардамчысың. Колдонуучунун темасы боюнча JSON форматында презентация мазмунун түзүп беришиң керек.
    Презентацияда ${slideCount} слайд болушу керек.
    Ар бир слайдда: 'title' (аталышы) жана 'content' (мазмуну - тизме катары же кыска текст) болушу шарт.
    Слайддар кыргыз тилинде болушу керек.
    Жоопту ТЕК ГАНА таза JSON форматында кайтар, эч кандай кошумча текстсиз.
    JSON түзүмү:
    {
      "title": "Презентациянын темасы",
      "slides": [
        { "title": "1-слайддын аталышы", "content": ["пункт 1", "пункт 2"] },
        ...
      ]
    }
  `

  try {
    const result = await model.generateContent([systemPrompt, prompt])
    const response = await result.response
    const text = response.text()
    
    // JSON тазалоо (Markdown код блокторун алып салуу)
    const cleanJson = text.replace(/```json|```/gi, '').trim()
    return JSON.parse(cleanJson)
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw new Error('Failed to generate slides content')
  }
}
