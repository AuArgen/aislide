import { NextRequest, NextResponse } from 'next/server'

interface StockImage {
  url: string
  thumb: string
  author: string
  authorUrl: string
  source: 'unsplash' | 'pexels'
}

async function searchUnsplash(query: string, page: number): Promise<StockImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20`,
    { headers: { Authorization: `Client-ID ${key}` } }
  )
  if (!res.ok) return []
  const json = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.results ?? []).map((item: any) => ({
    url: item.urls.regular,
    thumb: item.urls.thumb,
    author: item.user.name,
    authorUrl: item.user.links.html,
    source: 'unsplash' as const,
  }))
}

async function searchPexels(query: string, page: number): Promise<StockImage[]> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=20`,
    { headers: { Authorization: key } }
  )
  if (!res.ok) return []
  const json = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.photos ?? []).map((item: any) => ({
    url: item.src.large,
    thumb: item.src.small,
    author: item.photographer,
    authorUrl: item.photographer_url,
    source: 'pexels' as const,
  }))
}

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
