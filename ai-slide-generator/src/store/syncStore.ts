/**
 * syncStore.ts
 * Tiny Zustand slice that tracks the auto-save synchronisation state.
 * Consumed by useAutoSave (writer) and SyncStatusBadge (reader).
 */
'use client'

import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'

interface SyncStore {
  syncState: SyncState
  setSyncState(s: SyncState): void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSyncStore = create<SyncStore>((set) => ({
  syncState: 'idle',
  setSyncState: (syncState) => set({ syncState }),
}))
