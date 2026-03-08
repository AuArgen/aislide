/**
 * editorStore.ts
 * Zustand store for transient editor interaction state.
 * Separate from the persistent presentation data (slides) managed by PresentationEditor.
 */
'use client'

import { create } from 'zustand'
import type { SlideElement } from '@/types/elements'
import type { SnapGuide } from '@/lib/editor/snapEngine'
import type { XY } from '@/lib/editor/mathUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditorState {
  /** IDs of currently selected elements */
  selectedIds: string[]

  /** An element ID selected within a group (inline sub-selection) */
  subSelectedId: string | null

  /** True while the user is actively dragging elements */
  isDragging: boolean

  /** True while a resize is in progress */
  isResizing: boolean

  /** True while a rotation is in progress */
  isRotating: boolean

  /** Snap guide lines to render on the canvas overlay */
  snapGuides: SnapGuide[]

  /** Marquee drag start (canvas-local px), null when not active */
  marqueeStart: XY | null

  /** Marquee drag end (canvas-local px), null when not active */
  marqueeEnd: XY | null

  /** Clipboard for cut/copy/paste */
  clipboard: SlideElement[]

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Replace the entire selection with a new set of IDs */
  selectIds(ids: string[]): void

  /** Add a single ID to the selection */
  addSelectId(id: string): void

  /** Remove a single ID from the selection */
  removeSelectId(id: string): void

  /** Toggle one ID in/out of the selection (Shift+Click behaviour) */
  toggleSelectId(id: string): void

  /** Clear the selection entirely */
  clearSelection(): void

  /** Set (or clear) the sub-selected element inside a group */
  setSubSelected(id: string | null): void

  /** Record active snap guides (call with [] to clear) */
  setSnapGuides(guides: SnapGuide[]): void

  /** Update the marquee drag rectangle */
  setMarquee(start: XY | null, end: XY | null): void

  /** Stage elements in the clipboard */
  setClipboard(els: SlideElement[]): void

  /** Set the dragging flag */
  setIsDragging(v: boolean): void

  /** Set the resizing flag */
  setIsResizing(v: boolean): void

  /** Set the rotating flag */
  setIsRotating(v: boolean): void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>((set) => ({
  selectedIds:   [],
  subSelectedId: null,
  isDragging:    false,
  isResizing:    false,
  isRotating:    false,
  snapGuides:    [],
  marqueeStart:  null,
  marqueeEnd:    null,
  clipboard:     [],

  selectIds:      (ids)  => set({ selectedIds: ids }),
  addSelectId:    (id)   => set(s => ({ selectedIds: s.selectedIds.includes(id) ? s.selectedIds : [...s.selectedIds, id] })),
  removeSelectId: (id)   => set(s => ({ selectedIds: s.selectedIds.filter(x => x !== id) })),
  toggleSelectId: (id)   => set(s => ({
    selectedIds: s.selectedIds.includes(id)
      ? s.selectedIds.filter(x => x !== id)
      : [...s.selectedIds, id],
  })),
  clearSelection: ()     => set({ selectedIds: [], subSelectedId: null }),
  setSubSelected: (id)   => set({ subSelectedId: id }),
  setSnapGuides:  (g)    => set({ snapGuides: g }),
  setMarquee:     (s, e) => set({ marqueeStart: s, marqueeEnd: e }),
  setClipboard:   (els)  => set({ clipboard: els }),
  setIsDragging:  (v)    => set({ isDragging: v }),
  setIsResizing:  (v)    => set({ isResizing: v }),
  setIsRotating:  (v)    => set({ isRotating: v }),
}))
