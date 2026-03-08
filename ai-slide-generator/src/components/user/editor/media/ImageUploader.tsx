'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, Search, X, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react'

interface StockImage {
  url: string
  thumb: string
  author: string
  source: 'unsplash' | 'pexels'
}

interface ImageUploaderProps {
  onInsert: (src: string) => void
  onClose: () => void
}

export function ImageUploader({ onInsert, onClose }: ImageUploaderProps) {
  const [tab, setTab] = useState<'upload' | 'stock'>('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [stockImages, setStockImages] = useState<StockImage[]>([])
  const [searching, setSearching] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null)

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => setUploadPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      onInsert(json.url)
      onClose()
    } catch (err: unknown) {
      const e = err as Error
      // Fall back to local data URL so user can still use the image
      if (uploadPreview) {
        onInsert(uploadPreview)
        onClose()
      } else {
        setUploadError(e.message)
      }
    } finally {
      setUploading(false)
    }
  }, [onInsert, onClose, uploadPreview])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/stock-images?query=${encodeURIComponent(query.trim())}`)
      const json = await res.json()
      setStockImages(json.images ?? [])
    } catch { setStockImages([]) }
    finally { setSearching(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['upload', 'stock'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'upload' ? '📁 Жүктөө' : '🔍 Stock'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <X size={16} />
          </button>
        </div>

        {/* UPLOAD TAB */}
        {tab === 'upload' && (
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[280px] select-none
                ${dragOver ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            >
              {uploadPreview ? (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadPreview} alt="preview" className="max-h-60 max-w-full rounded-xl object-contain shadow" />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-2xl">
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Upload size={28} className="text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-700">Файлды ташып таштаңыз же басыңыз</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG, WEBP, SVG — макс. 10 МБ</p>
                  </div>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
            {uploadError && <p className="text-sm text-red-500 text-center">{uploadError}</p>}
          </div>
        )}

        {/* STOCK TAB */}
        {tab === 'stock' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <form onSubmit={handleSearch} className="px-6 pt-4 pb-3 border-b border-gray-100">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Сурот издеңиз... (кыргызча же англисче)"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button type="submit" disabled={searching} className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Издөө
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto p-4">
              {searching && (
                <div className="flex items-center justify-center h-40">
                  <Loader2 size={28} className="animate-spin text-blue-400" />
                </div>
              )}
              {!searching && stockImages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                  <ImageIcon size={36} className="opacity-30" />
                  <p className="text-sm">Издөө жүргүзүңүз</p>
                </div>
              )}
              {!searching && stockImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {stockImages.map((img, i) => (
                    <div key={i} className="relative group cursor-pointer rounded-xl overflow-hidden aspect-video bg-gray-100" onClick={() => { onInsert(img.url); onClose() }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.thumb} alt={img.author} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg transition-opacity">+ Кошуу</span>
                      </div>
                      <a href={img.source === 'unsplash' ? `https://unsplash.com` : `https://pexels.com`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={10} className="text-white" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
