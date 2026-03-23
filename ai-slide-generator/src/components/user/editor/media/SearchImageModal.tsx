'use client'

import { useState, useEffect, useRef } from 'react'
import Modal, { ModalFooter } from '@/components/shared/Modal'
import Button from '@/components/shared/Button'

interface SearchImageModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (source: 'stock' | 'ai', query: string) => void
  initialQuery?: string
}

export default function SearchImageModal({
  isOpen,
  onClose,
  onSearch,
  initialQuery = ''
}: SearchImageModalProps) {
  const [query, setQuery] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, initialQuery])

  if (!mounted) return null

  const handleAction = (source: 'stock' | 'ai') => {
    const trimmed = query.trim()
    if (trimmed) {
      onSearch(source, trimmed)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Сүрөт киргизүү"
      size="md"
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-500">
          Сүрөт издөө үчүн же AI аркылуу жаңы сүрөт чийдирүү үчүн теманы жазыңыз.
        </p>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleAction('stock')
            if (e.key === 'Escape') onClose()
          }}
          placeholder="Мисалы: бизнес, технология, келечектин шаары..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 bg-gray-50 uppercase-first"
        />

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} className="sm:mr-auto">
            Жокко чыгаруу
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleAction('ai')} 
            disabled={!query.trim()}
            className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 whitespace-nowrap"
          >
            <span>✨</span> AI менен жаратуу
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleAction('stock')} 
            disabled={!query.trim()}
            className="whitespace-nowrap"
          >
            Издөө (Сток)
          </Button>
        </div>
      </div>
    </Modal>
  )
}
