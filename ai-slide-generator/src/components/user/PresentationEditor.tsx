'use client'

import { useState } from 'react'
import { updatePresentation } from '@/lib/actions/user'
import { exportToPPTX, exportToPDF } from '@/lib/export'

interface Slide {
  title: string
  content: string[]
  image?: string
}

interface PresentationEditorProps {
  initialPresentation: {
    id: string
    title: string
    slides: Slide[]
    theme: string
  }
}

export function PresentationEditor({ initialPresentation }: PresentationEditorProps) {
  const [slides, setSlides] = useState<Slide[]>(initialPresentation.slides)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const currentSlide = slides[currentSlideIndex]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updatePresentation(initialPresentation.id, { slides })
      alert('Сакталды!')
    } catch (error) {
      alert('Ката кетти')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportPPTX = async () => {
    setIsExporting(true)
    try {
      const formattedSlides = slides.map(s => ({
        title: s.title,
        content: s.content.join('\n'),
        image: s.image
      }))
      await exportToPPTX(initialPresentation.title, formattedSlides)
    } catch (error) {
      console.error('Export error:', error)
      alert('PPTX экспорттоодо ката кетти')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportToPDF('presentation-content', initialPresentation.title)
    } catch (error) {
      console.error('Export error:', error)
      alert('PDF экспорттоодо ката кетти')
    } finally {
      setIsExporting(false)
    }
  }

  const updateSlideContent = (index: number, field: keyof Slide, value: any) => {
    const newSlides = [...slides]
    newSlides[index] = { ...newSlides[index], [field]: value }
    setSlides(newSlides)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      {/* Sidebar: Slide Thumbnails */}
      <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-4">
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Слайддар</h3>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? '...' : 'Сактоо'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleExportPPTX}
              disabled={isExporting}
              className="text-[10px] bg-gray-100 text-gray-700 px-2 py-2 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors flex flex-col items-center justify-center gap-1"
            >
              📊 PPTX
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="text-[10px] bg-gray-100 text-gray-700 px-2 py-2 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors flex flex-col items-center justify-center gap-1"
            >
              📄 PDF
            </button>
          </div>
          <button 
            onClick={() => {
              const url = `${window.location.origin}/presentation/${initialPresentation.id}`
              navigator.clipboard.writeText(url)
              alert('Шилтеме көчүрүлдү!')
            }}
            className="w-full text-xs bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
          >
            🔗 Бөлүшүү шилтемеси
          </button>
        </div>
        {slides.map((slide, index) => (
          <div
            key={index}
            onClick={() => setCurrentSlideIndex(index)}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
              currentSlideIndex === index ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="text-[10px] font-bold text-gray-400 mb-1">СЛАЙД {index + 1}</div>
            <div className="text-xs font-bold truncate">{slide.title}</div>
          </div>
        ))}
      </div>

      {/* Main Content: Slide Preview & Editor */}
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Slide Preview Area */}
          <div id="presentation-content" className="bg-white p-4 rounded-3xl">
            <div className="aspect-video bg-white shadow-2xl rounded-3xl p-12 flex flex-col justify-center border border-gray-100">
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent(currentSlideIndex, 'title', e.target.value)}
                className="text-4xl font-extrabold text-gray-900 mb-8 bg-transparent border-b-2 border-transparent hover:border-gray-100 focus:border-blue-500 outline-none w-full"
              />
              <div className="space-y-4">
                {currentSlide.content.map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-blue-500 font-bold mt-1">•</span>
                    <textarea
                      value={item}
                      onChange={(e) => {
                        const newContent = [...currentSlide.content]
                        newContent[i] = e.target.value
                        updateSlideContent(currentSlideIndex, 'content', newContent)
                      }}
                      className="flex-1 text-xl text-gray-600 bg-transparent border-b border-transparent hover:border-gray-100 focus:border-blue-500 outline-none resize-none"
                      rows={1}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400">
            <p>Тема: {initialPresentation.theme}</p>
            <p>Слайд {currentSlideIndex + 1} / {slides.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
