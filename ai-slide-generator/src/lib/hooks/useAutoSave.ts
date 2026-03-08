/**
 * useAutoSave.ts
 * Debounced auto-save hook for the presentation editor.
 *
 * Features:
 *  - 1 500 ms debounce: waits until the user stops making changes before firing.
 *  - SyncState tracking via useSyncStore: idle → unsaved → saving → saved|error
 *  - Offline fallback: on any network/server failure, serialises the slides to
 *    localStorage under `presentation_backup_<id>` with a timestamp.
 *  - Recovery detection: on mount, compares the local backup timestamp with the
 *    server version's `updatedAt` and exposes `recoverAvailable` if backup is newer.
 *  - Tab-close protection: adds a beforeunload listener while data is unsaved.
 */
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Slide } from '@/types/elements'
import { useSyncStore } from '@/store/syncStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalBackup {
  slides: Slide[]
  savedAt: number   // unix ms
}

interface UseAutoSaveOptions {
  slides: Slide[]
  presentationId: string
  serverUpdatedAt?: string   // ISO string from DB — used for staleness check
  updater: (id: string, data: { slides: Slide[] }) => Promise<unknown>
  /** Callback invoked when the user accepts a local recovery */
  onRecover?: (slides: Slide[]) => void
}

interface UseAutoSaveReturn {
  /** true when a newer local backup exists and hasn't been dismissed / recovered */
  recoverAvailable: boolean
  /** Call when the user clicks "Restore" */
  handleRecover: () => void
  /** Call when the user clicks "Dismiss" */
  handleDismissRecovery: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 1_500
const SAVED_DISPLAY_MS = 3_000
const backupKey = (id: string) => `presentation_backup_${id}`

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutoSave({
  slides,
  presentationId,
  serverUpdatedAt,
  updater,
  onRecover,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const { syncState, setSyncState } = useSyncStore()

  // Timer refs — stable across renders
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedDisplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track whether this is the very first render (skip saving on mount)
  const isFirstRender = useRef(true)

  // Recovery banner state
  const [recoverAvailable, setRecoverAvailable] = useState(false)

  // ── Recovery check on mount ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(backupKey(presentationId))
      if (!raw) return
      const backup: LocalBackup = JSON.parse(raw)
      if (!backup?.savedAt || !Array.isArray(backup?.slides)) return

      // Compare backup timestamp with server version
      const serverTs = serverUpdatedAt ? new Date(serverUpdatedAt).getTime() : 0
      if (backup.savedAt > serverTs) {
        setRecoverAvailable(true)
      }
    } catch {
      // Malformed backup — ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationId])

  // ── Save function ───────────────────────────────────────────────────────────
  const executeSave = useCallback(async (currentSlides: Slide[]) => {
    setSyncState('saving')
    try {
      await updater(presentationId, { slides: currentSlides })
      setSyncState('saved')

      // Auto-revert to idle after a short display period
      savedDisplayTimer.current = setTimeout(() => setSyncState('idle'), SAVED_DISPLAY_MS)

      // Clear any stale local backup on successful save
      try { localStorage.removeItem(backupKey(presentationId)) } catch { /* noop */ }
    } catch {
      setSyncState('error')

      // ── Offline fallback: persist to localStorage ──────────────────────────
      try {
        const backup: LocalBackup = { slides: currentSlides, savedAt: Date.now() }
        localStorage.setItem(backupKey(presentationId), JSON.stringify(backup))
      } catch {
        // localStorage quota exceeded or unavailable — nothing we can do
      }
    }
  }, [presentationId, updater, setSyncState])

  // ── Debounced observer ──────────────────────────────────────────────────────
  useEffect(() => {
    // Skip the initial mount — we don't want to save blank state on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Mark as unsaved immediately so the badge reflects pending changes
    setSyncState('unsaved')

    // Clear any pending timers
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (savedDisplayTimer.current) clearTimeout(savedDisplayTimer.current)

    // Arm the debounce
    debounceTimer.current = setTimeout(() => {
      executeSave(slides)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  // NOTE: `slides` intentionally drives this effect. executeSave & setSyncState
  // are stable references and safe to omit from the dependency array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides])

  // ── beforeunload guard ──────────────────────────────────────────────────────
  useEffect(() => {
    const DIRTY_STATES: typeof syncState[] = ['unsaved', 'saving', 'error']

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (DIRTY_STATES.includes(syncState)) {
        e.preventDefault()
        // Some browsers require returnValue to be set to show the dialog
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [syncState])

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (savedDisplayTimer.current) clearTimeout(savedDisplayTimer.current)
    }
  }, [])

  // ── Recovery handlers ───────────────────────────────────────────────────────
  const handleRecover = useCallback(() => {
    try {
      const raw = localStorage.getItem(backupKey(presentationId))
      if (!raw) return
      const backup: LocalBackup = JSON.parse(raw)
      if (Array.isArray(backup?.slides)) {
        onRecover?.(backup.slides)
        localStorage.removeItem(backupKey(presentationId))
      }
    } catch { /* noop */ }
    setRecoverAvailable(false)
  }, [presentationId, onRecover])

  const handleDismissRecovery = useCallback(() => {
    setRecoverAvailable(false)
    try { localStorage.removeItem(backupKey(presentationId)) } catch { /* noop */ }
  }, [presentationId])

  return { recoverAvailable, handleRecover, handleDismissRecovery }
}
