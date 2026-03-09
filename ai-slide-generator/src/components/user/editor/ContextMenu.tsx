import React, { useEffect, useRef } from 'react'
import { Copy, Trash, ArrowUpToLine, ArrowDownToLine, Scissors, ClipboardPaste, Undo, Redo, CopyPlus } from 'lucide-react'

interface ContextMenuProps {
    x: number
    y: number
    onClose: () => void
    onAction: (action: string) => void
    hasSelection: boolean
    hasClipboard: boolean
    canUndo: boolean
    canRedo: boolean
}

export function ContextMenu({
    x,
    y,
    onClose,
    onAction,
    hasSelection,
    hasClipboard,
    canUndo,
    canRedo,
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        // Listen in capture phase so it triggers before other click handlers
        document.addEventListener('mousedown', handleClickOutside, true)
        return () => document.removeEventListener('mousedown', handleClickOutside, true)
    }, [onClose])

    // Prevent right-clicking on the context menu itself from showing the browser menu
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    // Adjust position to stay within viewport
    const style: React.CSSProperties = {
        top: y,
        left: x,
        position: 'absolute',
        // Ensures we don't bleed off screen initially, but we might need real DOM measuring for perfect bounds.
        // For now, simple absolute positioning.
    }

    return (
        <div
            ref={menuRef}
            className="z-[9999] bg-white border border-gray-200 shadow-xl rounded-lg py-1.5 w-60 text-sm font-medium text-gray-700"
            style={style}
            onContextMenu={handleContextMenu}
        >
            <ContextMenuItem
                icon={<Undo size={14} />}
                label="Артка кайтаруу (Undo)"
                shortcut="Cmd+Z"
                onClick={() => onAction('undo')}
                disabled={!canUndo}
            />
            <ContextMenuItem
                icon={<Redo size={14} />}
                label="Алдыга жылуу (Redo)"
                shortcut="Cmd+Y"
                onClick={() => onAction('redo')}
                disabled={!canRedo}
            />
            <div className="h-px bg-gray-200 my-1.5 mx-2" />
            <ContextMenuItem
                icon={<Scissors size={14} />}
                label="Кесүү"
                shortcut="Cmd+X"
                onClick={() => onAction('cut')}
                disabled={!hasSelection}
            />
            <ContextMenuItem
                icon={<Copy size={14} />}
                label="Көчүрүү"
                shortcut="Cmd+C"
                onClick={() => onAction('copy')}
                disabled={!hasSelection}
            />
            <ContextMenuItem
                icon={<ClipboardPaste size={14} />}
                label="Жабыштыруу"
                shortcut="Cmd+V"
                onClick={() => onAction('paste')}
                disabled={!hasClipboard}
            />
            <ContextMenuItem
                icon={<CopyPlus size={14} />}
                label="Дубликат"
                shortcut="Cmd+D"
                onClick={() => onAction('duplicate')}
                disabled={!hasSelection}
            />
            <div className="h-px bg-gray-200 my-1.5 mx-2" />
            <ContextMenuItem
                icon={<ArrowUpToLine size={14} />}
                label="Алдыга алып чыгуу"
                onClick={() => onAction('bringForward')}
                disabled={!hasSelection}
            />
            <ContextMenuItem
                icon={<ArrowDownToLine size={14} />}
                label="Артка жөнөтүү"
                onClick={() => onAction('sendBackward')}
                disabled={!hasSelection}
            />
            <div className="h-px bg-gray-200 my-1.5 mx-2" />
            <ContextMenuItem
                icon={<Trash size={14} />}
                label="Жок кылуу"
                shortcut="Del"
                onClick={() => onAction('delete')}
                disabled={!hasSelection}
                danger
            />
        </div>
    )
}

function ContextMenuItem({
    icon,
    label,
    shortcut,
    onClick,
    disabled = false,
    danger = false,
}: {
    icon: React.ReactNode
    label: string
    shortcut?: string
    onClick: () => void
    disabled?: boolean
    danger?: boolean
}) {
    return (
        <button
            onClick={() => {
                if (!disabled) onClick()
            }}
            disabled={disabled}
            className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
        ${danger && !disabled ? 'text-red-600 hover:bg-red-50' : ''}
      `}
        >
            <div className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
            </div>
            {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
        </button>
    )
}
