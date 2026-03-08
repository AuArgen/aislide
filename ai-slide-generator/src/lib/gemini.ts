import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSettingByKey } from '@/lib/actions/settings'

async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, initialDelay: number = 1000): Promise<T> {
  let lastError: any
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      // 429 Too Many Requests же 500+ каталарын гана кайталап көрөбүз
      const isRetryable = error.status === 429 || (error.status >= 500 && error.status <= 599) || error.message?.includes('429')

      if (i < maxRetries && isRetryable) {
        const delay = initialDelay * Math.pow(2, i)
        console.warn(`Gemini API error (status: ${error.status}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }
  throw lastError
}

export async function generateSlides(prompt: string, slideCount: number = 5, tone: string = 'business') {
  let apiKey = await getSettingByKey('GEMINI_API_KEY')

  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY
  }

  if (!apiKey) {
    throw new Error('Gemini API key is not configured in settings or environment variables')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) // Using pro for better structural understanding

  const toneInstructions: Record<string, string> = {
    'business': 'Профессионалдык, так жана бизнес стилинде. Слайддар иштиктүү терминлерди камтышы керек.',
    'academic': 'Академиялык, илимий тилде. Маалыматтар терең жана далилдүү болушу шарт.',
    'creative': 'Креативдүү, шыктандыруучу жана жандуу тилде. Оригиналдуу идеяларды колдонуңуз.',
    'school': 'Жөнөкөй, түшүнүктүү жана кызыктуу тилде. Мектеп окуучуларына ылайыктуу.'
  }

  const selectedTone = toneInstructions[tone] || toneInstructions['business']

  const systemPrompt = `
Сен дүйнөлүк деңгээлдеги профессионалдык презентация дизайнерисиң жана мазмун жазуучусусуң.
Колдонуучунун темасы боюнча визуалдык жактан сонун, структураланган жана мазмундуу презентация жараткын.

ДИЗАЙН ЭРЕЖЕЛЕРИ:
- Ар бир слайдда ар башка фон (background) болушу керек — монотондуулуктан качкын.
- Биринчи слайд (аталыш слайды) эң сонун, фондуу болушу керек (gradient колдонуу).
- Тексттин түсү фон менен контрасттуу болушу шарт (ак фондо — кара текст, күңүрт фондо — ак текст).
- Элементтер слайдда логикалык жайгашуу керек: башында аталыш (жогору), андан кийин пункттар астыга ылдый жайгашат.
- Пункттар бири-биринен алыс болушу керек (y координаталары арасы кеминде 150 пиксел).
- Текстти слайддын четтерине жакын жайгаштырба (x кеминде 150, максимум 1600).

МААНИЛҮҮ КООРДИНАТА ЭРЕЖЕЛЕРИ (КАТУУ САКТАЛУУСУ ШАРТ!):
Слайддын өнөр жай стандартындагы өлчөмү: ТУУРАСЫ 1920px жана БИЙИКТИГИ 1080px.
БАРДЫК координаталар жана өлчөмдөр (x, y, width, height) ушул 1920x1080 пикселдик торго негизделип, абсолюттук бүтүн сан (пиксел) түрүндө берилиши КЕРЕК. Эч качан пайызды (0-100) колдонбо!
- x: 0-1920 (пиксел). Текст үчүн сол четтен 150-200 пикселден баштоо жакшы (мисалы, x: 150).
- y: 0-1080 (пиксел). Биринчи элемент жогору жактан 150-200px, кийинкилери +100-150px ылдый.
- width: 0-1920 (пиксел). Негизги текст үчүн туурасы 1400-1600 пиксел (мисалы, width: 1400).
- align: "left", "center" же "right".
- fontWeight: "normal" же "bold".
- fontSize: пикселде (негизги текст 28-36, аталыш пункт 36-48, чоң аталыш 64-96).

ФОНДОР (background) мисалдары — алардан тандагын же жаңы ойлогун:
- Ак/жарык: "#ffffff", "#f8fafc", "#f0f9ff"
- Күңүрт/кара: "#0f172a", "#1e293b", "#111827"
- Жылуу градиент: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
- Муз/синий: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
- Жашыл: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
- Океан: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
- Алтын: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)"
- Күн батышы: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"

ПРЕЗЕНТАЦИЯ СТРУКТУРАСЫ:
1. Биринчи слайд: аталыш слайды — чоң аталыш, кыскача аннотация, сонун фон
2. Негизги слайддар (${slideCount - 2} слайд): маалыматтар, диаграммалар, пункттар
3. Акыркы слайд: корутунду жана чакырык

Жалпысынан ${slideCount} слайд.
Тон: ${selectedTone}
Тил: Кыргыз тили (грамматикалык тактыкка өзгөчө көңүл бур).

Жоопту ТЕК ГАНА таза JSON форматында кайтар, эч кандай кошумча текстсиз.

JSON түзүмү (бардык x, y, width маанилери 1920x1080 пиксел торчосунда берилгендигин текшер!):
{
  "title": "Презентациянын аталышы",
  "slides": [
    {
      "title": "Слайд аталышы",
      "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "titleColor": "#ffffff",
      "elements": [
        {
          "type": "text",
          "content": "• Биринчи пункт",
          "x": 150,
          "y": 200,
          "width": 1400,
          "fontSize": 36,
          "color": "#ffffff",
          "align": "left",
          "fontWeight": "normal"
        },
        {
          "type": "text",
          "content": "• Экинчи пункт",
          "x": 150,
          "y": 350,
          "width": 1400,
          "fontSize": 36,
          "color": "#ffffff",
          "align": "left",
          "fontWeight": "normal"
        }
      ],
      "visual_hint": "сүрөттөмө"
    }
  ]
}
  `

  try {
    const result = await withRetry(() => model.generateContent([systemPrompt, prompt]))
    const response = await result.response
    const text = response.text()

    // JSON тазалоо
    const cleanJson = text.replace(/```json|```/gi, '').trim()
    return JSON.parse(cleanJson)
  } catch (error: any) {
    console.error('Gemini API Error:', error)

    if (error.status === 429 || error.message?.includes('429')) {
      throw new Error('Өтө көп суроо-талап жөнөтүлдү (Rate Limit). Сураныч, бир аздан кийин кайра аракет кылыңыз.')
    }

    throw new Error('Презентация мазмунун түзүүдө ката кетти: ' + (error.message || 'Белгисиз ката'))
  }
}
