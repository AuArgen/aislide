import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSettingByKey } from '@/lib/actions/settings'
import { GEMINI_LAYOUTS } from './geminiLayouts'

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
  const startTime = performance.now()
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

  // Select dynamic layouts
  const titleLayouts = GEMINI_LAYOUTS.filter(l => l.id.startsWith('title_'))
  const contentLayouts = GEMINI_LAYOUTS.filter(l => l.id.startsWith('content_'))
  const conclusionLayouts = GEMINI_LAYOUTS.filter(l => l.id.startsWith('conclusion_'))

  // Always 1 title, 1 conclusion, and the rest are random content blocks
  const selectedLayouts = []

  // 1. Title Slide
  selectedLayouts.push(titleLayouts[Math.floor(Math.random() * titleLayouts.length)])

  // 2. Content Slides
  const neededContent = Math.max(1, slideCount - 2)
  for (let i = 0; i < neededContent; i++) {
    selectedLayouts.push(contentLayouts[Math.floor(Math.random() * contentLayouts.length)])
  }

  // 3. Conclusion Slide
  if (slideCount > 1) {
    selectedLayouts.push(conclusionLayouts[Math.floor(Math.random() * conclusionLayouts.length)])
  }

  // Stringify the chosen templates for the prompt
  const templatesString = JSON.stringify(selectedLayouts.map((l, index) => ({
    slideNumber: index + 1,
    layoutName: l.name,
    purpose: l.description,
    elements: l.elements
  })), null, 2)

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
================================================================================

You are a world-class professional presentation designer and content writer.
Create a visually stunning, DEEPLY INFORMATIVE, and DETAILED presentation based on the user's topic: "${prompt}".

CRITICAL CONTENT RULE:
- DO NOT write short, generic text. Use statistics, facts, code snippets (if programming), and concrete examples extensively.
- Every slide must be extremely rich in information. Avoid empty or sparse slides. 
- ABSOLUTELY NO MARKDOWN FORMATTING IN TEXT CONTENT! Do NOT use \`**\` for bold or \`*\` for italics inside the \`content\` string. If you want text to be bold, set the \`fontWeight: "bold"\` property instead.

================================================================================
STRICT TEMPLATE FILLING RULES (CRITICAL)
================================================================================
I am providing you with EXACTLY ${slideCount} mathematically perfect, predefined JSON slide templates below.
You MUST output EXACTLY the same JSON structure I provided, but you must REPLACE ALL strings that look like "[FILL: ...]" with actual, rich presentation content.

- You MUST KEEP the exact geometric coordinates ("x", "y", "width", "height", "fontSize", "borderRadius") and structural "type" to ensure the layout remains perfect.
- You CAN and SHOULD modify the "color", "fill", and "iconName" properties dynamically to decorate the slide contextually!
- When changing colors, you MUST use the "Modern Dark Tech" palette:
  - Text: "#FFFFFF" (titles/highlights) or "#A0A0A0" (descriptions).
  - Accents/Fills/Icons: Use "#4ECDC4" (Cyan for tech/info), "#4ADE80" (Emerald Green for success/tips), "#F59E0B" (Orange for warnings/activity), or "#EC4899" (Pink for negative/alerts).
  - Card Backgrounds: Keep them "#1E1E1E" or "#2A2A2A".
- ONLY modify the \`content\` field of "text" and "code" elements, prioritizing deep, insightful details.
- For "icon" elements, change the \`iconName\` field to a standard Lucide icon name (e.g., "TrendingUp", "Shield", "Database", "Layers", "Code") that perfectly matches your text.
- You MUST use the exact background color "#121212" for ALL slides to match the aesthetic.

HERE ARE YOUR STRICT JSON TEMPLATES TO FILL:
${templatesString}

Total slides required: ${slideCount}.
Tone: ${selectedTone}

Return ONLY raw JSON. Do NOT include markdown formatting like \`\`\`json.

JSON Structure:
{
  "title": "Main Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "background": "#0f172a",
      "titleColor": "#ffffff",
      "elements": [
        // Exact elements array from the template, with [FILL: ...] replaced by your excellent content
      ],
      "visual_hint": "image description/search term"
    }
  ]
}
  `

  let totalTokens = 0
  let inputTokens = 0
  let outputTokens = 0
  
  try {
    const result = await withRetry(() => model.generateContent([systemPrompt, prompt]))
    const response = await result.response
    
    inputTokens = response.usageMetadata?.promptTokenCount || 0
    outputTokens = response.usageMetadata?.candidatesTokenCount || 0
    totalTokens = response.usageMetadata?.totalTokenCount || 0
    
    const text = response.text()
    
    const durationMs = performance.now() - startTime
    
    const costUsd = (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30

    // JSON тазалоо
    const cleanJson = text.replace(/```json|```/gi, '').trim()
    const content = JSON.parse(cleanJson)
    
    return {
      content,
      metadata: {
        rawResponse: text,
        tokensUsed: totalTokens,
        costUsd,
        durationMs: Math.round(durationMs)
      }
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    
    // Calculate tracked cost so far (if API returned usageMetadata before failing in inner steps or subsequent retries)
    const costUsd = (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30
    const durationMs = performance.now() - startTime

    if (error.status === 429 || error.message?.includes('429')) {
      throw new Error(JSON.stringify({ 
        message: 'Өтө көп суроо-талап жөнөтүлдү (Rate Limit). Сураныч, бир аздан кийин кайра аракет кылыңыз.',
        partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
      }))
    }

    if (error.status === 403 || error.status === 400 || error.message?.includes('API_KEY') || error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error(JSON.stringify({
        message: 'Сиздин API Key жараксыз же иштебейт. Сураныч, текшерип кайра көрүңүз.',
        partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
      }))
    }

    throw new Error(JSON.stringify({
      message: 'Презентация мазмунун түзүүдө ката кетти: ' + (error.message || 'Белгисиз ката'),
      partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
    }))
  }
}

export async function generateOutline(prompt: string, slideCount: number = 5, tone: string = 'business', audience: string = 'General', customApiKey?: string) {
  const startTime = performance.now()
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

  let inputTokens = 0
  let outputTokens = 0
  let totalTokens = 0
  
  try {
    const result = await withRetry(() => model.generateContent(systemPrompt))
    const response = await result.response
    const text = response.text()
    
    const durationMs = performance.now() - startTime
    
    inputTokens = response.usageMetadata?.promptTokenCount || 0
    outputTokens = response.usageMetadata?.candidatesTokenCount || 0
    totalTokens = response.usageMetadata?.totalTokenCount || 0
    const costUsd = (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30

    const cleanJson = text.replace(/```json|```/gi, '').trim()
    const content = JSON.parse(cleanJson)
    
    return {
      content,
      metadata: {
        rawResponse: text,
        tokensUsed: totalTokens,
        costUsd,
        durationMs: Math.round(durationMs)
      }
    }
  } catch (error: any) {
    console.error('Gemini API Error (Outline):', error)
    const costUsd = (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30
    const durationMs = performance.now() - startTime

    if (error.status === 429 || error.message?.includes('429')) {
      throw new Error(JSON.stringify({ 
        message: 'Өтө көп суроо-талап жөнөтүлдү (Rate Limit). Сураныч, бир аздан кийин кайра аракет кылыңыз.',
        partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
      }))
    }

    if (error.status === 403 || error.status === 400 || error.message?.includes('API_KEY') || error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error(JSON.stringify({
        message: 'Сиздин API Key жараксыз же иштебейт. Сураныч, текшерип кайра көрүңүз.',
        partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
      }))
    }

    throw new Error(JSON.stringify({
      message: 'Презентациянын планын түзүүдө ката кетти: ' + (error.message || 'Белгисиз ката'),
      partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
    }))
  }
}

export async function generateSingleSlide(outlineItem: any, colorTheme: string, customApiKey?: string) {
  const startTime = performance.now()
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

  let totalTokens = 0
  let inputTokens = 0
  let outputTokens = 0

  try {
    const result = await withRetry(() => model.generateContent(systemPrompt))
    const response = await result.response
    
    inputTokens = response.usageMetadata?.promptTokenCount || 0
    outputTokens = response.usageMetadata?.candidatesTokenCount || 0
    totalTokens = response.usageMetadata?.totalTokenCount || 0
    
    const text = response.text()
    
    const durationMs = performance.now() - startTime
    const costUsd = (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30

    const cleanJson = text.replace(/```json|```/gi, '').trim()
    const content = JSON.parse(cleanJson)
    
    return {
      content,
      metadata: {
        rawResponse: text,
        tokensUsed: totalTokens,
        costUsd,
        durationMs: Math.round(durationMs)
      }
    }
  } catch (error: any) {
    console.error('Gemini API Error (Single Slide):', error)
    
    const costUsd = (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30
    const durationMs = performance.now() - startTime

    if (error.status === 429 || error.message?.includes('429')) {
      throw new Error(JSON.stringify({ 
        message: 'Өтө көп суроо-талап жөнөтүлдү (Rate Limit). Сураныч, бир аздан кийин кайра аракет кылыңыз.',
        partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
      }))
    }
    if (error.status === 403 || error.status === 400 || error.message?.includes('API_KEY') || error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error(JSON.stringify({
        message: 'Сиздин API Key жараксыз же иштебейт. Сураныч, текшерип кайра көрүңүз.',
        partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
      }))
    }
    throw new Error(JSON.stringify({
      message: 'Слайдды түзүүдө ката кетти: ' + (error.message || 'Белгисиз ката'),
      partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
    }))
  }
}
