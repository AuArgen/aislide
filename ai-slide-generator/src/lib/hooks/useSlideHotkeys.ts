/**
 * useSlideHotkeys.ts
 * Global keyboard shortcuts for slide-level actions.
 * Must only fire when focus is NOT inside a text input / contentEditable.
 *
 * Backspace/Delete deletes the active slide ONLY when focus is inside the
 * slide sidebar panel ([data-sidebar-panel]). This prevents accidental
 * deletions while working in the toolbar or canvas.
 */
'use client'

import { useEffect } from 'react'
import { useSlidesStore } from '@/store/slidesStore'
import { useEditorStore } from '@/store/editorStore'

export function useSlideHotkeys() {
  const { activeSlideId, addSlide, deleteSlide, duplicateSlide, undo, redo, slides } = useSlidesStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement
      const isText =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active as HTMLElement)?.contentEditable === 'true' ||
        (active as HTMLElement)?.dataset?.richText === 'true'

      const meta = e.metaKey || e.ctrlKey

      // ── Undo / Redo (always active, even in text fields) ─────────────────────
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if ((meta && e.shiftKey && e.key === 'z') || (meta && e.key === 'y')) {
        e.preventDefault(); redo(); return
      }

      // ── Slide actions (blocked when typing) ───────────────────────────────────
      if (isText) return
      if (!activeSlideId) return

      // Cmd/Ctrl+D — Duplicate
      if (meta && e.key === 'd') { e.preventDefault(); duplicateSlide(activeSlideId); return }

      // Cmd/Ctrl+M — Add new slide
      if (meta && e.key === 'm') { e.preventDefault(); addSlide({ afterId: activeSlideId }); return }

      // Enter — Add new slide (only when nothing is editing)
      if (e.key === 'Enter' && !meta && !e.shiftKey) {
        // Don't intercept if a slide thumbnail or button has focus (they handle their own click)
        if (active && active !== document.body) return
        e.preventDefault()
        addSlide({ afterId: activeSlideId })
        return
      }

      // Backspace / Delete — Delete active slide ONLY when focus is inside the
      // slide sidebar panel. This prevents accidental deletes while working in
      // the toolbar, canvas or any other part of the UI.
      if ((e.key === 'Backspace' || e.key === 'Delete') && slides.length > 1) {
        const { selectedIds } = useEditorStore.getState()
        if (selectedIds.length === 0) {
          const sidebarEl = document.querySelector('[data-sidebar-panel]')
          const inSidebar = sidebarEl?.contains(document.activeElement)
          if (inSidebar) {
            e.preventDefault()
            deleteSlide(activeSlideId)
          }
        }
      }
    }

    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [activeSlideId, slides.length, addSlide, deleteSlide, duplicateSlide, undo, redo])
}
