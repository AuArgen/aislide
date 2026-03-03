import { getPresentationById } from '@/lib/actions/user'
import { PresentationEditor } from '@/components/editor/PresentationEditor'
import { notFound } from 'next/navigation'

export default async function EditorPage({ params }: { params: { id: string } }) {
  const presentation = await getPresentationById(params.id)

  if (!presentation) {
    notFound()
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <PresentationEditor initialPresentation={presentation} />
    </div>
  )
}
