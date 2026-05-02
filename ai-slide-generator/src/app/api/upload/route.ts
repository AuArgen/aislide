import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image field in form data' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use PNG, JPG, WEBP or SVG.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    const ext = file.type.split('/')[1].replace('svg+xml', 'svg')
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    return NextResponse.json({ url: `${baseUrl}/uploads/${filename}` })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
