'use client'

/**
 * SyncStatusBadge.tsx
 * Small indicator component that reflects the auto-save syncState in the toolbar.
 *
 * States → visual:
 *   idle     → Gray cloud icon, no label
 *   unsaved  → Amber cloud-off icon  "Сакталган жок"
 *   saving   → Blue spinning cloud   "Сакталууда…"
 *   saved    → Green cloud-check     "Сакталды"
 *   error    → Red cloud-x           "Ката!"
 */

import { Cloud, CloudOff, CloudCheck, CloudAlert } from 'lucide-react'
import { useSyncStore, type SyncState } from '@/store/syncStore'

// ─── Config table ─────────────────────────────────────────────────────────────

const CONFIG: Record<
  SyncState,
  { label: string; color: string; bg: string; Icon: React.ElementType; spin: boolean }
> = {
  idle: {
    label: '',
    color: 'text-gray-400',
    bg: '',
    Icon: Cloud,
    spin: false,
  },
  unsaved: {
    label: 'Сакталган жок',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    Icon: CloudOff,
    spin: false,
  },
  saving: {
    label: 'Сакталууда…',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    Icon: Cloud,
    spin: true,
  },
  saved: {
    label: 'Сакталды',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    Icon: CloudCheck,
    spin: false,
  },
  error: {
    label: 'Ката!',
    color: 'text-red-500',
    bg: 'bg-red-50',
    Icon: CloudAlert,
    spin: false,
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SyncStatusBadge() {
  const syncState = useSyncStore((s) => s.syncState)
  const { label, color, bg, Icon, spin } = CONFIG[syncState]

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-300
        ${bg} ${color}
        ${syncState === 'idle' ? 'opacity-50' : 'opacity-100'}
      `}
      title={label || 'Автосактоо'}
    >
      <Icon
        size={15}
        className={`shrink-0 transition-all duration-300 ${spin ? 'animate-spin' : ''}`}
      />
      {label && (
        <span className="text-[11px] font-semibold whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}
