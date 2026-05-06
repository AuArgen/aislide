import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_TEXT_CHARS = 20000

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 413 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const name = file.name.toLowerCase()

    if (name.endsWith('.pdf')) {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const result = await parser.getText()
      const text = cleanText(result.text).slice(0, MAX_TEXT_CHARS)
      return NextResponse.json({ text, pages: result.total, chars: text.length })
    }

    if (name.endsWith('.docx')) {
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ buffer })
      const text = cleanText(result.value).slice(0, MAX_TEXT_CHARS)
      return NextResponse.json({ text, chars: text.length })
    }

    return NextResponse.json({ error: 'Unsupported file type. Use PDF or DOCX.' }, { status: 400 })
  } catch (err: any) {
    console.error('[parse-document]', err)
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 })
  }
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .trim()
}
