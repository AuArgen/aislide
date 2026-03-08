import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'REMOVE_BG_API_KEY not configured' }, { status: 503 })
  }

  let imageUrl: string
  try {
    const body = await req.json()
    imageUrl = body.imageUrl
    if (!imageUrl || typeof imageUrl !== 'string') throw new Error()
  } catch {
    return NextResponse.json({ error: 'Invalid request body. Provide { imageUrl: string }' }, { status: 400 })
  }

  try {
    const formData = new FormData()
    formData.append('image_url', imageUrl)
    formData.append('size', 'auto')

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('remove.bg error:', text)
      return NextResponse.json({ error: 'Background removal failed: ' + text }, { status: res.status })
    }

    const arrayBuffer = await res.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    return NextResponse.json({ dataUrl })
  } catch (err) {
    console.error('bg-remove route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
