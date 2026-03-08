/**
 * slidesStore.ts
 * Zustand store for the slide array, active slide tracking, and undo/redo history.
 * This is the single source of truth for slide-level state in the editor.
 */
'use client'

import { create } from 'zustand'
import type { Slide, SlideLayoutType } from '@/types/elements'
import { makeId } from '@/types/elements'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50

/** Create a blank slide with a stable id */
export function makeBlankSlide(
  layoutType: SlideLayoutType = 'blank',
  overrides?: Partial<Slide>,
): Slide {
  const id = makeId()
  const base: Slide = {
    id,
    title: layoutType === 'title' ? 'Аталышты жазыңыз' : 'Жаңы слайд',
    elements: [],
    background: '#ffffff',
    titleColor: '#1f2937',
    layoutType,
    speakerNotes: '',
    isHidden: false,
  }

  if (layoutType === 'title-body') {
    base.elements = [
      {
        id: makeId(), type: 'text',
        content: 'Ички аталыш',
        x: 40, y: 80, width: 720, height: 60,
        fontSize: 36, color: '#1f2937',
        align: 'center', lineHeight: 1.4, opacity: 1,
      } as import('@/types/elements').TextElement,
      {
        id: makeId(), type: 'text',
        content: 'Мазмунду бул жерге жазыңыз...',
        x: 40, y: 160, width: 720, height: 220,
        fontSize: 20, color: '#374151',
        align: 'left', lineHeight: 1.6, opacity: 1,
      } as import('@/types/elements').TextElement,
    ]
  }
  if (layoutType === 'title') {
    base.elements = [
      {
        id: makeId(), type: 'text',
        content: 'Презентация аталышы',
        x: 40, y: 140, width: 720, height: 80,
        fontSize: 48, color: '#1f2937',
        align: 'center', fontWeight: 'bold', lineHeight: 1.2, opacity: 1,
      } as import('@/types/elements').TextElement,
      {
        id: makeId(), type: 'text',
        content: 'Автор аты · Дата',
        x: 40, y: 240, width: 720, height: 50,
        fontSize: 22, color: '#6b7280',
        align: 'center', lineHeight: 1.4, opacity: 1,
      } as import('@/types/elements').TextElement,
    ]
  }
  if (layoutType === 'two-column') {
    base.elements = [
      {
        id: makeId(), type: 'text',
        content: 'Сол мамыча',
        x: 20, y: 80, width: 360, height: 300,
        fontSize: 20, color: '#1f2937',
        align: 'left', lineHeight: 1.6, opacity: 1,
      } as import('@/types/elements').TextElement,
      {
        id: makeId(), type: 'text',
        content: 'Оң мамыча',
        x: 420, y: 80, width: 360, height: 300,
        fontSize: 20, color: '#1f2937',
        align: 'left', lineHeight: 1.6, opacity: 1,
      } as import('@/types/elements').TextElement,
    ]
  }

  return { ...base, ...overrides }
}

/** Ensure every slide in a loaded array has a stable id */
export function hydrateSlidesIds(slides: Slide[]): Slide[] {
  return slides.map(s => ({ ...s, id: s.id || makeId() }))
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlidesState {
  slides: Slide[]
  activeSlideId: string | null

  // ── Undo / Redo stacks (each entry is a full slides snapshot) ──────────────
  history: Slide[][]
  future: Slide[][]

  // ── Initialisation ─────────────────────────────────────────────────────────
  initSlides(slides: Slide[]): void

  // ── Navigation ─────────────────────────────────────────────────────────────
  setActiveSlide(id: string): void

  // ── CRUD ───────────────────────────────────────────────────────────────────
  addSlide(opts?: { layoutType?: SlideLayoutType; afterId?: string }): string
  deleteSlide(id: string): void
  duplicateSlide(id: string): string
  reorderSlides(fromIndex: number, toIndex: number): void

  // ── Per-slide mutations ─────────────────────────────────────────────────────
  updateSlide(id: string, partial: Partial<Slide>): void
  toggleHideSlide(id: string): void
  updateSpeakerNotes(id: string, notes: string): void

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  undo(): void
  redo(): void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSlidesStore = create<SlidesState>((set, get) => {
  // ── Internal helper — push a snapshot to history before mutation ────────────
  function snapshot() {
    const { slides, history } = get()
    const prev = JSON.parse(JSON.stringify(slides)) as Slide[]
    const newHistory = [...history, prev].slice(-MAX_HISTORY)
    return newHistory
  }

  return {
    slides: [],
    activeSlideId: null,
    history: [],
    future: [],

    // ── Init ──────────────────────────────────────────────────────────────────
    initSlides(rawSlides) {
      const slides = hydrateSlidesIds(rawSlides)
      set({ slides, activeSlideId: slides[0]?.id ?? null, history: [], future: [] })
    },

    // ── Navigation ────────────────────────────────────────────────────────────
    setActiveSlide(id) {
      set({ activeSlideId: id })
    },

    // ── Add ───────────────────────────────────────────────────────────────────
    addSlide({ layoutType = 'blank', afterId } = {}) {
      const newHistory = snapshot()
      const slide = makeBlankSlide(layoutType)
      set(s => {
        const slides = [...s.slides]
        const insertAfter = afterId
          ? slides.findIndex(x => x.id === afterId)
          : slides.findIndex(x => x.id === s.activeSlideId)
        const at = insertAfter === -1 ? slides.length : insertAfter + 1
        slides.splice(at, 0, slide)
        return { slides, activeSlideId: slide.id, history: newHistory, future: [] }
      })
      return slide.id
    },

    // ── Delete ────────────────────────────────────────────────────────────────
    deleteSlide(id) {
      const { slides } = get()
      if (slides.length <= 1) return   // Never delete the last slide
      const newHistory = snapshot()
      set(s => {
        const idx = s.slides.findIndex(x => x.id === id)
        if (idx === -1) return s
        const next = s.slides.filter(x => x.id !== id)
        // Fallback active: previous slide, or next, or first
        const newActive =
          next[idx - 1]?.id ?? next[idx]?.id ?? next[0]?.id ?? null
        return { slides: next, activeSlideId: newActive, history: newHistory, future: [] }
      })
    },

    // ── Duplicate ─────────────────────────────────────────────────────────────
    duplicateSlide(id) {
      const newHistory = snapshot()
      let newId = ''
      set(s => {
        const idx = s.slides.findIndex(x => x.id === id)
        if (idx === -1) return s
        const copy: Slide = JSON.parse(JSON.stringify(s.slides[idx]))
        copy.id = makeId()
        copy.elements = copy.elements.map(e => ({ ...e, id: makeId() }))
        newId = copy.id
        const slides = [...s.slides]
        slides.splice(idx + 1, 0, copy)
        return { slides, activeSlideId: copy.id, history: newHistory, future: [] }
      })
      return newId
    },

    // ── Reorder ───────────────────────────────────────────────────────────────
    reorderSlides(fromIndex, toIndex) {
      if (fromIndex === toIndex) return
      const newHistory = snapshot()
      set(s => {
        const slides = [...s.slides]
        const [removed] = slides.splice(fromIndex, 1)
        const realTo = toIndex > fromIndex ? toIndex - 1 : toIndex
        slides.splice(realTo, 0, removed)
        return { slides, history: newHistory, future: [] }
      })
    },

    // ── Per-slide update ──────────────────────────────────────────────────────
    updateSlide(id, partial) {
      set(s => ({
        slides: s.slides.map(sl => sl.id === id ? { ...sl, ...partial } : sl),
      }))
    },

    toggleHideSlide(id) {
      const newHistory = snapshot()
      set(s => ({
        slides: s.slides.map(sl =>
          sl.id === id ? { ...sl, isHidden: !sl.isHidden } : sl,
        ),
        history: newHistory,
        future: [],
      }))
    },

    updateSpeakerNotes(id, notes) {
      set(s => ({
        slides: s.slides.map(sl =>
          sl.id === id ? { ...sl, speakerNotes: notes } : sl,
        ),
      }))
    },

    // ── Undo ─────────────────────────────────────────────────────────────────
    undo() {
      const { history, slides, future } = get()
      if (history.length === 0) return
      const prev = history[history.length - 1]
      const newHistory = history.slice(0, -1)
      const newFuture = [JSON.parse(JSON.stringify(slides)) as Slide[], ...future].slice(0, MAX_HISTORY)
      const activeSlideId = prev[0]?.id ?? null
      set({ slides: prev, history: newHistory, future: newFuture, activeSlideId })
    },

    // ── Redo ─────────────────────────────────────────────────────────────────
    redo() {
      const { future, slides, history } = get()
      if (future.length === 0) return
      const next = future[0]
      const newFuture = future.slice(1)
      const newHistory = [...history, JSON.parse(JSON.stringify(slides)) as Slide[]].slice(-MAX_HISTORY)
      const activeSlideId = next[0]?.id ?? null
      set({ slides: next, history: newHistory, future: newFuture, activeSlideId })
    },
  }
})
