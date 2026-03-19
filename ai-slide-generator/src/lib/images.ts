export interface StockImage {
  url: string
  thumb: string
  author: string
  authorUrl: string
  source: 'unsplash' | 'pexels'
}

export async function searchUnsplash(query: string, page: number = 1): Promise<StockImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.results ?? []).map((item: any) => ({
      url: item.urls.regular,
      thumb: item.urls.thumb,
      author: item.user.name,
      authorUrl: item.user.links.html,
      source: 'unsplash' as const,
    }))
  } catch (e) {
    console.error('Unsplash Search Error:', e)
    return []
  }
}

export async function searchPexels(query: string, page: number = 1): Promise<StockImage[]> {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=20`,
      { headers: { Authorization: key } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.photos ?? []).map((item: any) => ({
      url: item.src.large,
      thumb: item.src.small,
      author: item.photographer,
      authorUrl: item.photographer_url,
      source: 'pexels' as const,
    }))
  } catch (e) {
    console.error('Pexels Search Error:', e)
    return []
  }
}

/**
 * Searches for a single relevant image from Unsplash or Pexels.
 */
export async function getRandomStockImage(query: string): Promise<string | null> {
  const images = await searchUnsplash(query, 1)
  if (images.length > 0) return images[Math.floor(Math.random() * Math.min(5, images.length))].url
  
  const pexelsImages = await searchPexels(query, 1)
  if (pexelsImages.length > 0) return pexelsImages[Math.floor(Math.random() * Math.min(5, pexelsImages.length))].url
  
  return null
}
