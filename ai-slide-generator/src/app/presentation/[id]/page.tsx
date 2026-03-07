import { getPresentationById } from '@/lib/actions/user'
import { notFound } from 'next/navigation'

export default async function PresentationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const presentation = await getPresentationById(id)

  if (!presentation) {
    notFound()
  }

  const slides = (presentation as any).slides as any[]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{(presentation as any).title}</h1>
          <p className="text-gray-500">Автору: AI Slide Generator</p>
        </div>

        <div className="space-y-12">
          {slides.map((slide, index) => (
            <div key={index} className="aspect-video bg-white shadow-xl rounded-3xl p-12 flex flex-col justify-center border border-gray-100">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8">{slide.title}</h2>
              <div className="space-y-4">
                {slide.content.map((item: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-blue-500 font-bold mt-1 text-2xl">•</span>
                    <p className="text-2xl text-gray-600 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
