'use client'

import { useState, useRef } from 'react'
import type { VideoElement } from '@/types/elements'
import { Loader2, Play, Link } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'gif' | null; id?: string; embedUrl?: string } {
  if (!url) return { type: null }

  // GIF
  if (url.match(/\.(gif)(\?|$)/i)) return { type: 'gif' }

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    const id = ytMatch[1]
    return { type: 'youtube', id, embedUrl: `https://www.youtube.com/embed/${id}?rel=0` }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    const id = vimeoMatch[1]
    return { type: 'vimeo', id, embedUrl: `https://player.vimeo.com/video/${id}` }
  }

  return { type: null }
}

async function fetchYoutubeThumbnail(videoId: string): Promise<string> {
  // Try maxresdefault, fall back to hqdefault
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

async function fetchVimeoThumbnail(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`)
    if (!res.ok) return ''
    const json = await res.json()
    return json[0]?.thumbnail_medium ?? ''
  } catch {
    return ''
  }
}

// ─── VideoEmbed ───────────────────────────────────────────────────────────────

interface VideoEmbedProps {
  element: VideoElement
  onUpdate: (updates: Partial<VideoElement>) => void
  presentationMode?: boolean
}

export function VideoEmbed({ element, onUpdate, presentationMode = false }: VideoEmbedProps) {
  const [editing, setEditing] = useState(!element.src)
  const [urlInput, setUrlInput] = useState(element.src ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleApplyUrl = async () => {
    const url = urlInput.trim()
    if (!url) return
    setLoading(true); setError(null)

    const parsed = parseVideoUrl(url)
    if (!parsed.type) {
      setError('Жарактуу URL эмес. YouTube, Vimeo же GIF URL жазыңыз.')
      setLoading(false); return
    }

    let thumbUrl = ''
    if (parsed.type === 'youtube' && parsed.id) thumbUrl = await fetchYoutubeThumbnail(parsed.id)
    if (parsed.type === 'vimeo' && parsed.id) thumbUrl = await fetchVimeoThumbnail(parsed.id)

    onUpdate({
      src: url,
      videoType: parsed.type === 'gif' ? 'gif' : parsed.type,
      embedUrl: parsed.embedUrl,
      thumbnailUrl: thumbUrl || undefined,
    })
    setLoading(false)
    setEditing(false)
  }

  // ── Presentation mode: show actual iframe / gif ──────────────────────────
  if (presentationMode) {
    if (element.videoType === 'gif') {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={element.src} alt="GIF" className="w-full h-full object-cover" style={{ opacity: element.opacity ?? 1 }} />
      )
    }
    if (element.embedUrl) {
      return (
        <iframe
          src={element.embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          style={{ opacity: element.opacity ?? 1 }}
        />
      )
    }
  }

  // ── Editor mode: input form or thumbnail preview ──────────────────────────
  if (editing) {
    return (
      <div
        className="w-full h-full bg-gray-900/90 rounded-xl flex flex-col items-center justify-center gap-3 p-4"
        onDoubleClick={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-white/70">
          <Link size={18} />
          <span className="text-sm font-semibold">YouTube, Vimeo же GIF URL</span>
        </div>
        <input
          ref={inputRef}
          type="url" value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleApplyUrl() }}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:border-white/60"
          autoFocus
          onPointerDown={e => e.stopPropagation()}
        />
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <button
          onClick={handleApplyUrl}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Кошуу
        </button>
      </div>
    )
  }

  // Thumbnail / GIF preview in editor
  return (
    <div
      className="w-full h-full relative overflow-hidden rounded-xl group"
      style={{ opacity: element.opacity ?? 1 }}
      onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
    >
      {element.videoType === 'gif' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={element.src} alt="GIF" className="w-full h-full object-cover" />
      ) : (
        <>
          {element.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={element.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Play size={40} className="text-white/40" />
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play size={22} className="text-gray-900 ml-1" fill="currentColor" />
            </div>
          </div>
          {/* Source badge */}
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {element.videoType}
          </div>
        </>
      )}
      {/* Edit hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap">
        2× = URL өзгөртүү
      </div>
    </div>
  )
}

// ─── Video Controls (right panel) ────────────────────────────────────────────
interface VideoControlsProps {
  element: VideoElement
  onUpdate: (updates: Partial<VideoElement>) => void
}

export function VideoControls({ element, onUpdate }: VideoControlsProps) {
  return (
    <div className="w-[200px] shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Видео / GIF</h3>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-[10px] text-gray-500 font-medium mb-1">URL</p>
        <p className="text-[10px] text-gray-400 break-all line-clamp-2">{element.src || '—'}</p>
        <p className="text-[10px] font-bold uppercase mt-1 text-indigo-500">{element.videoType}</p>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ачыктык</span>
          <span className="text-[10px] font-bold text-blue-500">{Math.round((element.opacity ?? 1) * 100)}%</span>
        </div>
        <input type="range" min={10} max={100} value={Math.round((element.opacity ?? 1) * 100)}
          onChange={e => onUpdate({ opacity: Number(e.target.value) / 100 })}
          className="w-full h-1.5 appearance-none rounded-full accent-blue-500" />
      </div>
      <div className="px-4 pb-3 text-[10px] text-gray-400">
        2× слайдта басып URL өзгөртүңүз
      </div>
    </div>
  )
}
