'use client'

import { useState, useEffect } from 'react'

/**
 * A hook that takes an image source (possibly starting with 'stock:')
 * and resolves it to a real URL by calling the internal API.
 */
export function useResolveStockImage(src: string | null | undefined, onResolve?: (url: string, query: string) => void) {
  const [resolvedSrc, setResolvedSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // If it's already a real URL or empty, just sync it
    if (!src || (!src.startsWith('stock:') && !src.startsWith('ai:'))) {
      setResolvedSrc(src)
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchImage = async () => {
      setIsLoading(true)
      try {
        if (src.startsWith('ai:')) {
          const query = src.replace('ai:', '').trim()
          const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: query })
          })

          if (!res.ok) {
            const errBody = await res.text()
            throw new Error(`Failed to generate AI image: ${res.status} ${errBody}`)
          }

          const data = await res.json()
          if (!data.url) throw new Error('No URL returned from AI generation')

          const imageUrl = data.url
          
          if (isMounted) {
            setResolvedSrc(imageUrl)
            if (onResolve) onResolve(imageUrl, query)
          }
        } else if (src.startsWith('stock:')) {
          const query = src.replace('stock:', '').trim()
          const res = await fetch(`/api/stock-images?query=${encodeURIComponent(query)}&page=1`)
          if (!res.ok) throw new Error('Failed to fetch stock image')
          
          const data = await res.json()
          if (isMounted && data.images && data.images.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(3, data.images.length))
            const imageUrl = data.images[randomIndex].url
            setResolvedSrc(imageUrl)
            if (onResolve) onResolve(imageUrl, query)
          }
        }
      } catch (error) {
        console.error('Error resolving image:', error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchImage()

    return () => {
      isMounted = false
    }
  }, [src]) // Only re-run when src changes

  return { src: resolvedSrc, isLoading }
}
