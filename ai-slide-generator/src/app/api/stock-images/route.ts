import { NextRequest, NextResponse } from 'next/server'
import { searchUnsplash, searchPexels } from '@/lib/images'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')?.trim()
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  if (!query) {
    return NextResponse.json({ error: 'Missing query param' }, { status: 400 })
  }

  // Try Unsplash first, fall back to Pexels
  let images = await searchUnsplash(query, page)
  if (images.length === 0) {
    images = await searchPexels(query, page)
  }

  if (images.length === 0 && !process.env.UNSPLASH_ACCESS_KEY && !process.env.PEXELS_API_KEY) {
    return NextResponse.json({
      images: [],
      warning: 'No API keys configured. Set UNSPLASH_ACCESS_KEY or PEXELS_API_KEY in .env'
    })
  }

  return NextResponse.json({ images })
}
