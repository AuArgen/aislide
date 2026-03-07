import { getPresentationById } from '@/lib/actions/user'
import { PresentationEditor } from '@/components/user/PresentationEditor'
import { notFound } from 'next/navigation'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const presentation = await getPresentationById(id)

  if (!presentation) {
    notFound()
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <PresentationEditor initialPresentation={presentation} />
    </div>
  )
}
