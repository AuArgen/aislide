'use client'

import { Cloud, CloudOff, CloudCheck, CloudAlert } from 'lucide-react'
import { useSyncStore, type SyncState } from '@/store/syncStore'
import { useT } from '@/components/shared/LanguageProvider'

type Config = { color: string; bg: string; Icon: React.ElementType; spin: boolean; labelKey: string }

const CONFIG: Record<SyncState, Config> = {
  idle:    { labelKey: '',                  color: 'text-gray-400',    bg: '',               Icon: Cloud,       spin: false },
  unsaved: { labelKey: 'editor.syncUnsaved', color: 'text-amber-500',   bg: 'bg-amber-50',    Icon: CloudOff,    spin: false },
  saving:  { labelKey: 'editor.saving',      color: 'text-blue-500',    bg: 'bg-blue-50',     Icon: Cloud,       spin: true  },
  saved:   { labelKey: 'editor.saved',       color: 'text-emerald-500', bg: 'bg-emerald-50',  Icon: CloudCheck,  spin: false },
  error:   { labelKey: 'editor.syncError',   color: 'text-red-500',     bg: 'bg-red-50',      Icon: CloudAlert,  spin: false },
}

export function SyncStatusBadge() {
  const t = useT()
  const syncState = useSyncStore((s) => s.syncState)
  const { color, bg, Icon, spin, labelKey } = CONFIG[syncState]
  const label = labelKey ? t(labelKey as Parameters<typeof t>[0]) : ''

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-300
        ${bg} ${color}
        ${syncState === 'idle' ? 'opacity-50' : 'opacity-100'}
      `}
      title={label || t('editor.autoSave')}
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
