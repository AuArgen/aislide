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

export async function generateSlides(prompt: string, slideCount: number = 5, tone: string = 'business', customApiKey?: string) {
  let apiKey = customApiKey || await getSettingByKey('GEMINI_API_KEY')

  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY
  }

  if (!apiKey) {
    throw new Error('Gemini API key is not configured in settings or environment variables')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) // Using pro for better structural understanding

  const toneInstructions: Record<string, string> = {
    'business': 'Professional, clear, and business-oriented. Use appropriate terminology.',
    'academic': 'Academic, scientific, and highly detailed. Ensure strict and factual language.',
    'creative': 'Creative, inspiring, and dynamic. Use original ideas and engaging phrasing.',
    'school': 'Simple, understandable, and engaging. Suitable for school students.'
  }

  const selectedTone = toneInstructions[tone] || toneInstructions['business']

  const systemPrompt = `
================================================================================
CRITICAL LANGUAGE RULE - READ THIS FIRST!
================================================================================
You MUST identify the language of the user's input topic (prompt).
You MUST generate 100% of the slide content (titles, subtitles, bullet points, body text, core messages, conclusions) in that EXACT SAME LANGUAGE.
- If the user writes in Kyrgyz (Кыргызча), output in Kyrgyz.
- If the user writes in Russian (Русский), output in Russian.
- If the user writes in English, output in English.
- If the user writes in ANY other language, output in THAT language.

FORBIDDEN: 
- DO NOT translate the user's topic into English.
- DO NOT default to English.
- DO NOT switch languages mid-presentation.
LANGUAGE SWITCHING IS A CRITICAL FAILURE. Any deviation from the detected input language will result in incorrect output.
================================================================================

You are a world-class professional presentation designer and content writer.
Create a visually stunning, highly structured, DEEPLY INFORMATIVE, and DETAILED presentation based on the user's topic.

CRITICAL CONTENT RULE:
- DO NOT write short, generic text. Use statistics, facts, code snippets (if the topic is programming), and concrete examples extensively.
- Every slide must be extremely rich in information. Avoid empty or sparse slides. 
- You MUST generate ALL content (title, slide titles, text, bullet points) in the EXACT SAME LANGUAGE as the user's topic prompt. 
- For example, if the user writes in Kyrgyz, output the presentation in Kyrgyz. If in Russian, output in Russian. If in English, output in English.
- ABSOLUTELY NO MARKDOWN FORMATTING IN TEXT CONTENT! Do NOT use \`**\` for bold or \`*\` for italics inside the \`content\` string. If you want text to be bold, set the \`fontWeight: "bold"\` property instead.

DESIGN RULES:
- Use a different background for each slide — avoid monotony.
- The first slide (title slide) should be gorgeous, ideally using a beautiful gradient background.
- Text color must contrast strongly with the background (light text on dark background, dark text on light background).
- Logical element placement: Title at the top, followed by bullet points cascading downwards.
- Elements must be spaced out (e.g., at least 150 pixels gap between y-coordinates).
- Do not place text too close to the edges (x should be at least 150, max 1600).

STRICT COORDINATE RULES (MUST BE FOLLOWED!):
The standard slide dimension is WIDTH: 1920px and HEIGHT: 1080px.
ALL coordinates and dimensions (x, y, width, height) MUST be based on this 1920x1080 pixel grid and provided as absolute integers (pixels). NEVER use percentages (0-100)!
- x: 0-1920 (pixels). For text, start 150-200 pixels from the left edge (e.g., x: 150).
- y: 0-1080 (pixels). First element 150-200px from top, subsequent ones +100-150px downwards.
- width: 0-1920 (pixels). For main text body, use width 1400-1600.
- align: "left", "center", or "right".
- fontWeight: "normal" or "bold".
- fontSize: in pixels (main text 28-36, bullet point titles 36-48, main titles 64-96).

BACKGROUND EXAMPLES (choose from these or invent new ones):
- Light: "#ffffff", "#f8fafc", "#f0f9ff"
- Dark: "#0f172a", "#1e293b", "#111827"
- Warm Gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
- Ice/Blue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
- Green: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
- Ocean: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
- Gold: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)"
- Sunset: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"

PRESENTATION STRUCTURE:
1. First slide: Title slide — main title, short subtitle/annotation, beautiful background.
2. Main body slides (${slideCount - 2} slides): Deep information, specific statistics, code examples, or step-by-step processes. Avoid sparse slides. Each slide MUST have at least 2-3 significant content blocks/bullets.
3. Last slide: Main takeaways, recommendations, and conclusion.

Total slides required: ${slideCount}.
Tone: ${selectedTone}

Return ONLY raw JSON. Do NOT include markdown formatting like \`\`\`json.

JSON Structure (verify all x, y, width values fit within the 1920x1080 grid!):
{
  "title": "Main Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "titleColor": "#ffffff",
      "elements": [
        {
          "type": "text",
          "content": "• First bullet point with deep detail",
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
          "content": "• Second bullet point with deep detail",
          "x": 150,
          "y": 350,
          "width": 1400,
          "fontSize": 36,
          "color": "#ffffff",
          "align": "left",
          "fontWeight": "normal"
        }
      ],
      "visual_hint": "image description/search term"
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

    if (error.status === 403 || error.status === 400 || error.message?.includes('API_KEY') || error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error('Сиздин API Key жараксыз же иштебейт. Сураныч, текшерип кайра көрүңүз.')
    }

    throw new Error('Презентация мазмунун түзүүдө ката кетти: ' + (error.message || 'Белгисиз ката'))
  }
}

export async function generateOutline(prompt: string, slideCount: number = 5, tone: string = 'business', audience: string = 'General', customApiKey?: string) {
  let apiKey = customApiKey || await getSettingByKey('GEMINI_API_KEY')
  if (!apiKey) apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key is not configured in settings or environment variables')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const toneInstructions: Record<string, string> = {
    'business': 'Professional, clear, and business-oriented.',
    'academic': 'Academic, scientific, and highly detailed.',
    'creative': 'Creative, inspiring, and dynamic.',
    'school': 'Simple, understandable, and engaging.'
  }
  const selectedTone = toneInstructions[tone] || toneInstructions['business']

  const systemPrompt = `
================================================================================
CRITICAL LANGUAGE RULE - READ THIS FIRST!
================================================================================
You MUST identify the language of the user's input topic (${prompt}).
You MUST generate 100% of the outline content (slide titles, core messages) in that EXACT SAME LANGUAGE.
- If the user writes in Kyrgyz (Кыргызча), output in Kyrgyz.
- If the user writes in Russian (Русский), output in Russian.
- If the user writes in English, output in English.
- If the user writes in ANY other language, output in THAT language.

FORBIDDEN: 
- DO NOT translate the user's topic into English.
- DO NOT default to English.
- DO NOT switch languages in the outline.
LANGUAGE SWITCHING IS A CRITICAL FAILURE. Any deviation from the detected input language will result in incorrect output.
================================================================================

You are a world-class professional presentation designer.
Create ONLY the structure (outline) for a presentation based on the user's topic.

TOPIC: ${prompt}
NUMBER OF SLIDES: ${slideCount}
AUDIENCE: ${audience}
STYLE/TONE: ${selectedTone}

Return ONLY the following JSON array format, with absolutely no additional text or markdown formatting:
[
  {
    "slideNumber": 1,
    "title": "Slide Title",
    "coreMessage": "Core meaning/message of the slide (1-2 sentences)",
    "suggestedVisual": "Suggested visual design or image"
  }
]
`

  try {
    const result = await withRetry(() => model.generateContent(systemPrompt))
    const response = await result.response
    const text = response.text()
    const cleanJson = text.replace(/```json|```/gi, '').trim()
    return JSON.parse(cleanJson)
  } catch (error: any) {
    console.error('Gemini API Error (Outline):', error)
    if (error.status === 403 || error.status === 400 || error.message?.includes('API_KEY') || error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error('Сиздин API Key жараксыз же иштебейт. Сураныч, текшерип кайра көрүңүз.')
    }
    throw new Error('Презентациянын планын түзүүдө ката кетти: ' + (error.message || 'Белгисиз ката'))
  }
}

export async function generateSingleSlide(outlineItem: any, colorTheme: string, customApiKey?: string) {
  let apiKey = customApiKey || await getSettingByKey('GEMINI_API_KEY')
  if (!apiKey) apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key is not configured in settings or environment variables')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const systemPrompt = `
================================================================================
CRITICAL LANGUAGE RULE - READ THIS FIRST!
================================================================================
You MUST identify the language of the provided slide outline (${outlineItem.title} and ${outlineItem.coreMessage}).
You MUST generate 100% of the slide content (title, bullet points, body text) in that EXACT SAME LANGUAGE.
- If the outline is in Kyrgyz (Кыргызча), output in Kyrgyz.
- If the outline is in Russian (Русский), output in Russian.
- If the outline is in English, output in English.
- If the outline is in ANY other language, output in THAT language.

FORBIDDEN: 
- DO NOT translate the slide content into English.
- DO NOT default to English.
- DO NOT switch languages in the slide content.
LANGUAGE SWITCHING IS A CRITICAL FAILURE. Any deviation from the detected input language will result in incorrect output.
================================================================================

You are a world-class professional presentation designer and content writer.
Based on the following outline information, create the full visual and content structure for EXACTLY ONE slide.

SLIDE OUTLINE:
Title: ${outlineItem.title}
Core Message: ${outlineItem.coreMessage}
Visual Suggestion: ${outlineItem.suggestedVisual}

COLOR THEME: ${colorTheme}
(Select an appropriate 'background' and 'titleColor' fitting this theme).

DESIGN AND STRICT COORDINATE RULES (PAY CLOSE ATTENTION):
The standard slide dimension is WIDTH: 1920px and HEIGHT: 1080px.
ALL coordinates and dimensions (x, y, width, height) MUST be based on this 1920x1080 pixel grid and provided as absolute integers (pixels). NEVER use percentages (0-100)!
- x: 0-1920. For text, start 150-200 pixels from the left edge.
- y: 0-1080. First element 150-200px from top, subsequent ones downwards. Space out bullet points (at least 100-150px gap).
- width: 0-1920. For main text body, use width 1400-1600.
- align: "left", "center", or "right".
- fontWeight: "normal" or "bold".
- fontSize: in pixels (main text 28-36, bullet titles 36-48, large main titles 64-96).
- color: Text color MUST contrast well with the chosen background.

Return ONLY raw JSON. Do NOT include markdown formatting like \`\`\`json.
{
  "title": "\${outlineItem.title}",
  "background": "Background (e.g. hex #0f172a, or linear-gradient)",
  "titleColor": "#ffffff",
  "elements": [
    {
      "type": "text",
      "content": "• Slide content (detailed bullet point)",
      "x": 150,
      "y": 200,
      "width": 1400,
      "fontSize": 36,
      "color": "#ffffff",
      "align": "left",
      "fontWeight": "normal"
    }
  ],
  "visual_hint": "\${outlineItem.suggestedVisual}"
}
`

  try {
    const result = await withRetry(() => model.generateContent(systemPrompt))
    const response = await result.response
    const text = response.text()
    const cleanJson = text.replace(/```json|```/gi, '').trim()
    return JSON.parse(cleanJson)
  } catch (error: any) {
    console.error('Gemini API Error (Single Slide):', error)
    if (error.status === 429 || error.message?.includes('429')) {
      throw new Error('Өтө көп суроо-талап жөнөтүлдү (Rate Limit). Сураныч, бир аздан кийин кайра аракет кылыңыз.')
    }
    if (error.status === 403 || error.status === 400 || error.message?.includes('API_KEY') || error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error('Сиздин API Key жараксыз же иштебейт. Сураныч, текшерип кайра көрүңүз.')
    }
    throw new Error('Слайдды түзүүдө ката кетти: ' + (error.message || 'Белгисиз ката'))
  }
}
