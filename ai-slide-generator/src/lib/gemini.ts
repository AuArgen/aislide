import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSettingByKey } from '@/lib/actions/settings'
import { GEMINI_LAYOUTS } from './geminiLayouts'

export type AiProvider = 'gemini' | 'openai'

const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-5.4-mini',
}

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'

export interface AiResponse<T> {
  content: T
  metadata: {
    rawResponse: string
    fullPrompt: string
    clientPrompt: string
    isValid: boolean
    inputTokens: number
    outputTokens: number
    tokensUsed: number
    costUsd: number
    durationMs: number
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  apiName: string = 'AI API',
): Promise<T> {
  let lastError: any
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      // 429 Too Many Requests же 500+ каталарын гана кайталап көрөбүз
      const message = String(error.message || '').toLowerCase()
      const isInsufficientQuota = error.code === 'insufficient_quota' || message.includes('insufficient_quota') || message.includes('current quota')
      const isRetryable = !isInsufficientQuota && (
        error.status === 429 ||
        (error.status >= 500 && error.status <= 599) ||
        message.includes('429') ||
        message.includes('rate limit')
      )

      if (i < maxRetries && isRetryable) {
        const delay = initialDelay * Math.pow(2, i)
        console.warn(`${apiName} error (status: ${error.status}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }
  throw lastError
}

async function getProviderApiKey(provider: AiProvider, customApiKey?: string): Promise<string> {
  if (customApiKey?.trim()) return customApiKey.trim()

  if (provider === 'gemini') {
    let apiKey = await getSettingByKey('GEMINI_API_KEY')
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY ?? null
    if (!apiKey) throw new Error('Gemini API key is not configured in settings or environment variables')
    return apiKey
  }

  let apiKey = await getSettingByKey('OPENAI_API_KEY')
  if (!apiKey) apiKey = process.env.OPENAI_API_KEY ?? null
  if (!apiKey) throw new Error('OpenAI API key is not configured in settings or environment variables')
  return apiKey
}

async function resolveProviderApiKey(provider: AiProvider, customApiKey?: string) {
  const apiKey = await getProviderApiKey(provider, customApiKey)
  return {
    apiKey,
    apiKeyMask: maskApiKey(apiKey),
  }
}

function estimateCostUsd(provider: AiProvider, inputTokens: number, outputTokens: number): number {
  if (provider === 'gemini') {
    return (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30
  }

  return 0
}

function extractOpenAiOutputText(response: any): string {
  if (typeof response.output_text === 'string') return response.output_text.trim()

  const chunks: string[] = []
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === 'string') chunks.push(content.text)
      if (typeof content.output_text === 'string') chunks.push(content.output_text)
    }
  }

  return chunks.join('\n').trim()
}

function maskApiKey(apiKey: string): string {
  if (!apiKey) return ''
  const trimmed = apiKey.trim()
  if (trimmed.length <= 24) return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
  return `${trimmed.slice(0, 15)}...${trimmed.slice(-6)}`
}

async function generateProviderText(
  provider: AiProvider,
  prompt: string,
  customApiKey?: string,
  modelId?: string,
): Promise<{ text: string; inputTokens: number; outputTokens: number; totalTokens: number; rawResponse: string; apiKeyMask: string }> {
  const { apiKey, apiKeyMask } = await resolveProviderApiKey(provider, customApiKey)
  const selectedModel = modelId || DEFAULT_MODELS[provider]

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: selectedModel })
    const result = await withRetry(() => model.generateContent(prompt), 3, 1000, 'Gemini API')
    const response = await result.response
    const inputTokens = response.usageMetadata?.promptTokenCount || 0
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0
    const totalTokens = response.usageMetadata?.totalTokenCount || 0
    const text = response.text()

    return {
      text,
      inputTokens,
      outputTokens,
      totalTokens,
      rawResponse: text,
      apiKeyMask,
    }
  }

  const data = await withRetry(async () => {
    const res = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        input: prompt,
        store: false,
      }),
    })

    const raw = await res.text()
    let parsed: any = null
    try {
      parsed = raw ? JSON.parse(raw) : null
    } catch {}

    if (!res.ok) {
      const message = parsed?.error?.message || raw || res.statusText
      const error = new Error(message) as Error & { status?: number; code?: string }
      error.status = res.status
      error.code = parsed?.error?.code
      throw error
    }

    return parsed
  }, 3, 1000, 'OpenAI API')

  const inputTokens = data?.usage?.input_tokens || 0
  const outputTokens = data?.usage?.output_tokens || 0
  const totalTokens = data?.usage?.total_tokens || inputTokens + outputTokens

  return {
    text: extractOpenAiOutputText(data),
    inputTokens,
    outputTokens,
    totalTokens,
    rawResponse: JSON.stringify(data),
    apiKeyMask,
  }
}

function throwProviderError(
  provider: AiProvider,
  error: any,
  inputTokens: number,
  outputTokens: number,
  totalTokens: number,
  durationMs: number,
  fallbackMessage: string,
  apiKeyMask?: string,
): never {
  const costUsd = estimateCostUsd(provider, inputTokens, outputTokens)
  const message = String(error?.message || '')
  const lowerMessage = message.toLowerCase()
  const status = error?.status

  if (status === 429 || lowerMessage.includes('429') || lowerMessage.includes('rate limit')) {
    throw new Error(JSON.stringify({
      type: 'RATE_LIMIT',
      apiKeyMask,
      partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
    }))
  }

  if (
    status === 401 ||
    status === 403 ||
    lowerMessage.includes('api_key') ||
    lowerMessage.includes('api key') ||
    lowerMessage.includes('incorrect api key') ||
    lowerMessage.includes('api key not valid')
  ) {
    throw new Error(JSON.stringify({
      type: 'INVALID_API_KEY',
      apiKeyMask,
      partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
    }))
  }

  throw new Error(JSON.stringify({
    message: `${fallbackMessage}: ${message || 'Белгисиз ката'}`,
    apiKeyMask,
    partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
  }))
}

export async function generateSlides(prompt: string, slideCount: number = 5, tone: string = 'business', customApiKey?: string): Promise<AiResponse<any>> {
  const startTime = performance.now()
  let apiKey = customApiKey || await getSettingByKey('GEMINI_API_KEY')

  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY ?? null
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
- For "image" elements, set the \`src\` field to a descriptive English keyword for a stock image search, prefixed with "stock:". 
  Example: "stock:modern office building", "stock:team working on laptop", "stock:abstract technology background".
- For "background", you can now use a hex color OR a stock image search query. 
  If the slide layout benefits from a photo background, set \`background\` to "stock:[descriptive keyword]". 
  If using an image background, ensure the overlay color and text contrast remain readable.
- You MUST use the exact background color "#121212" for ALL slides UNLESS you choose to use a stock image background.

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
    const result = await withRetry(() => model.generateContent([systemPrompt, prompt]), 3, 1000, 'Gemini API')
    const response = await result.response
    
    inputTokens = response.usageMetadata?.promptTokenCount || 0
    outputTokens = response.usageMetadata?.candidatesTokenCount || 0
    totalTokens = response.usageMetadata?.totalTokenCount || 0
    
    const text = response.text()
    
    const durationMs = performance.now() - startTime
    
    const costUsd = (inputTokens / 1000000) * 0.075 + (outputTokens / 1000000) * 0.30

    // JSON тазалоо
    const cleanJson = text.replace(/```json|```/gi, '').trim()
    let content: any = null
    let isValid = false

    try {
      content = JSON.parse(cleanJson)
      // Слайддар мазмунун текшерүү
      if (content && typeof content === 'object' && content.title && Array.isArray(content.slides)) {
        isValid = true
      }
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e)
    }
    
    return {
      content,
      metadata: {
        rawResponse: text,
        fullPrompt: `${systemPrompt}\n\nUSER PROMPT: ${prompt}`,
        clientPrompt: prompt,
        isValid,
        inputTokens,
        outputTokens,
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
        type: 'RATE_LIMIT',
        partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
      }))
    }

    if (error.status === 403 || error.status === 400 || error.message?.includes('API_KEY') || error.message?.includes('invalid') || error.message?.includes('not found')) {
      throw new Error(JSON.stringify({
        type: 'INVALID_API_KEY',
        partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
      }))
    }

    throw new Error(JSON.stringify({
      message: 'Презентация мазмунун түзүүдө ката кетти: ' + (error.message || 'Белгисиз ката'),
      partialMetadata: { tokensUsed: totalTokens, costUsd, durationMs: Math.round(durationMs) }
    }))
  }
}

export async function generateOutline(
  prompt: string,
  slideCount: number = 5,
  tone: string = 'business',
  audience: string = 'General',
  customApiKey?: string,
  fileContext?: string,
  imageFiles?: Array<{ filename: string; url: string }>,
  modelId?: string,
  provider: AiProvider = 'gemini',
): Promise<AiResponse<any>> {
  const startTime = performance.now()

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
${fileContext ? `\nADDITIONAL CONTEXT FROM ATTACHED TEXT FILES (use this to make the outline accurate and relevant):\n${fileContext}\n` : ''}${imageFiles?.length ? `
================================================================================
ATTACHED IMAGES — DECIDE USAGE FOR EACH (REQUIRED)
================================================================================
The user has attached the following images. For each image decide the best usage:
${imageFiles.map(f => `- "${f.filename}" (url: ${f.url})`).join('\n')}

Usage options:
- "background" → use as a visual background across all slides (best for scenic, textural, atmospheric photos)
- "element"    → display as a content image on the most relevant slide (best for diagrams, charts, product photos, portraits). Also specify slideNumber (1-based).
- "context"    → use only as reference to understand content, do NOT display visually (best for screenshots, logos, reference material)

You MUST include imageDecisions for every attached image in your JSON response.
================================================================================
` : ''}
Return ONLY the following JSON object (no markdown, no extra text):
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "coreMessage": "Core meaning/message of the slide (1-2 sentences)",
      "suggestedVisual": "Suggested visual design or image"
    }
  ],
  "imageDecisions": [
    { "filename": "photo.jpg", "usage": "background" },
    { "filename": "chart.png", "usage": "element", "slideNumber": 2 },
    { "filename": "logo.png", "usage": "context" }
  ]
}
`

  let inputTokens = 0
  let outputTokens = 0
  let totalTokens = 0
  const apiKeyMask = customApiKey ? maskApiKey(customApiKey) : undefined
  
  try {
    const completion = await generateProviderText(provider, systemPrompt, customApiKey, modelId)
    const text = completion.text
    
    const durationMs = performance.now() - startTime
    
    inputTokens = completion.inputTokens
    outputTokens = completion.outputTokens
    totalTokens = completion.totalTokens
    const costUsd = estimateCostUsd(provider, inputTokens, outputTokens)

    // JSON тазалоо
    const cleanJson = text.replace(/```json|```/gi, '').trim()
    let slides: any = null
    let imageDecisions: any[] = []
    let isValid = false

    try {
      const parsed = JSON.parse(cleanJson)
      // New format: { slides: [...], imageDecisions: [...] }
      // Old format (array) kept for backward compat
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slides)) {
        slides = parsed.slides
        imageDecisions = Array.isArray(parsed.imageDecisions) ? parsed.imageDecisions : []
        isValid = true
      } else if (Array.isArray(parsed)) {
        slides = parsed
        isValid = true
      }
    } catch (e) {
      console.error('Failed to parse Gemini outline response as JSON:', e)
    }

    return {
      content: { slides, imageDecisions },
      metadata: {
        rawResponse: completion.rawResponse,
        fullPrompt: systemPrompt,
        clientPrompt: prompt,
        isValid,
        inputTokens,
        outputTokens,
        tokensUsed: totalTokens,
        costUsd,
        durationMs: Math.round(durationMs)
      }
    }
  } catch (error: any) {
    console.error(`${provider} API Error (Outline):`, error)
    const durationMs = performance.now() - startTime
    throwProviderError(provider, error, inputTokens, outputTokens, totalTokens, durationMs, 'Презентациянын планын түзүүдө ката кетти', apiKeyMask)
  }
}

const COLOR_PALETTES: Record<string, { bg: string; titleColor: string; detailColor: string; accents: string[] }> = {
  'Modern Dark': {
    bg: '#0D1117',
    titleColor: '#FFFFFF',
    detailColor: '#8B949E',
    accents: ['#4ECDC4', '#4ADE80', '#F59E0B', '#EC4899'],
  },
  'Minimalist Light': {
    bg: '#FFFFFF',
    titleColor: '#111827',
    detailColor: '#6B7280',
    accents: ['#2563EB', '#7C3AED', '#059669', '#DC2626'],
  },
  'Corporate Blue': {
    bg: '#0F2044',
    titleColor: '#FFFFFF',
    detailColor: '#94A3B8',
    accents: ['#3B82F6', '#60A5FA', '#38BDF8', '#06B6D4'],
  },
  'Creative Pastel': {
    bg: '#FFF8F0',
    titleColor: '#2D1B69',
    detailColor: '#6B7280',
    accents: ['#F472B6', '#A78BFA', '#34D399', '#FBBF24'],
  },
  'Vibrant Warm': {
    bg: '#1A0A00',
    titleColor: '#FFF7ED',
    detailColor: '#D4A853',
    accents: ['#F97316', '#EF4444', '#EAB308', '#84CC16'],
  },
}

export async function generateSingleSlide(
  outlineItem: any,
  colorTheme: string,
  customApiKey?: string,
  modelId?: string,
  provider: AiProvider = 'gemini',
): Promise<AiResponse<any>> {
  const startTime = performance.now()

  const palette = COLOR_PALETTES[colorTheme] ?? COLOR_PALETTES['Modern Dark']

  // Select a random content layout
  const contentLayouts = GEMINI_LAYOUTS.filter(l => l.id.startsWith('content_'))
  const selectedLayout = contentLayouts[Math.floor(Math.random() * contentLayouts.length)]

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
================================================================================

You are a world-class professional presentation designer and content writer.
Based on the following outline information, create the full visual and content structure for EXACTLY ONE slide.

SLIDE OUTLINE:
Title: ${outlineItem.title}
Core Message: ${outlineItem.coreMessage}
Visual Suggestion: ${outlineItem.suggestedVisual}

================================================================================
MANDATORY COLOR THEME: "${colorTheme}"
================================================================================
You MUST use EXACTLY these colors. Using any other colors is a critical failure.
- Slide background: "${palette.bg}"  ← MUST use this exact value
- Title text color: "${palette.titleColor}"
- Body / detail text: "${palette.detailColor}"
- Accent fills / icon colors: choose from ${palette.accents.join(', ')}
DO NOT use colors from other themes. DO NOT use dark backgrounds for light themes.
================================================================================

================================================================================
STRICT TEMPLATE FILLING RULES (CRITICAL)
================================================================================
You MUST use the following EXACT JSON template for this slide.
TEMPLATE NAME: ${selectedLayout.name}
TEMPLATE STRUCTURE:
${JSON.stringify(selectedLayout.elements, null, 2)}

DIRECTIONS:
1. REPLACE ALL strings that look like "[FILL: ...]" with actual, rich presentation content.
2. DO NOT change "x", "y", "width", "height", "fontSize", or "type" properties.
3. You CAN and SHOULD update "color", "fill", and "iconName" properties to match the color theme above!
4. For "icon" elements, use standard Lucide icon names (e.g., "Cpu", "Activity", "Shield", "Zap", "Globe") that fit the content.

Return ONLY raw JSON. Do NOT include markdown formatting like \`\`\`json.
{
  "title": "${outlineItem.title}",
  "background": "${palette.bg}",
  "titleColor": "${palette.titleColor}",
  "bg": { "type": "solid", "value": "${palette.bg}" },
  "elements": [
    // EXACT elements array from the template, with [FILL: ...] replaced by your excellent content
  ],
  "visual_hint": "${outlineItem.suggestedVisual}"
}
`

  let totalTokens = 0
  let inputTokens = 0
  let outputTokens = 0
  const apiKeyMask = customApiKey ? maskApiKey(customApiKey) : undefined

  try {
    const completion = await generateProviderText(provider, systemPrompt, customApiKey, modelId)
    
    inputTokens = completion.inputTokens
    outputTokens = completion.outputTokens
    totalTokens = completion.totalTokens
    
    const text = completion.text
    
    const durationMs = performance.now() - startTime
    const costUsd = estimateCostUsd(provider, inputTokens, outputTokens)

    // JSON тазалоо
    const cleanJson = text.replace(/```json|```/gi, '').trim()
    let content: any = null
    let isValid = false

    try {
      content = JSON.parse(cleanJson)
      if (content && typeof content === 'object' && content.title && Array.isArray(content.elements)) {
        isValid = true
      }
    } catch (e) {
      console.error('Failed to parse Gemini single slide response as JSON:', e)
    }
    
    return {
      content,
      metadata: {
        rawResponse: completion.rawResponse,
        fullPrompt: systemPrompt,
        clientPrompt: outlineItem.title,
        isValid,
        inputTokens,
        outputTokens,
        tokensUsed: totalTokens,
        costUsd,
        durationMs: Math.round(durationMs)
      }
    }
  } catch (error: any) {
    console.error(`${provider} API Error (Single Slide):`, error)
    
    const durationMs = performance.now() - startTime
    throwProviderError(provider, error, inputTokens, outputTokens, totalTokens, durationMs, 'Слайдды түзүүдө ката кетти', apiKeyMask)
  }
}
