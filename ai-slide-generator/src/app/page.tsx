import { cookies } from 'next/headers'
import { getCurrentSession } from '@/lib/auth/auth-helpers'
import { getUserByGoogleId } from '@/lib/auth/auth-db'
import { getUserSubscription, getUserPresentations } from '@/lib/actions/user'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { PresentationForm } from '@/components/user/PresentationForm'
import { LandingContent } from '@/components/home/LandingContent'
import { DeletePresentationButton } from '@/components/user/DeletePresentationButton'
import Link from 'next/link'

export default async function Home() {
  const session = await getCurrentSession()

  if (!session) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar user={null} presentations={[]} isPremium={false} isAdmin={false} />
        <main className="flex-1 overflow-auto bg-white rounded-l-2xl">
          <LandingContent />
        </main>
      </div>
    )
  }

  const googleId = session.user.user_metadata?.google_id
  const user = googleId ? await getUserByGoogleId(googleId) : null

  if (!user) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar user={null} presentations={[]} isPremium={false} isAdmin={false} />
        <main className="flex-1 overflow-auto bg-white rounded-l-2xl">
          <LandingContent />
        </main>
      </div>
    )
  }

  const [subscription, presentations] = await Promise.all([
    getUserSubscription(user.id),
    getUserPresentations(user.id),
  ])

  const isAdmin = user.role === 'admin'
  const isTeacher = user.role === 'teacher'
  const isPremium = (subscription as any)?.status === 'active' || isAdmin || isTeacher
  const isPending = (subscription as any)?.status === 'pending'

  const userForSidebar = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        user={userForSidebar}
        presentations={presentations as any[]}
        isPremium={isPremium}
        isAdmin={isAdmin}
      />
      <main className="flex-1 overflow-auto bg-white rounded-l-2xl flex flex-col">
        <div className="flex-1 overflow-auto">
          <PresentationForm userId={user.id} canGenerate={isPremium} />
        </div>

        {/* Presentations list below the form */}
        <PresentationsSection
          presentations={presentations as any[]}
          isPremium={isPremium}
          isPending={isPending}
          isAdmin={isAdmin}
          userId={user.id}
        />
      </main>
    </div>
  )
}

function PresentationsSection({
  presentations,
  isPremium,
  isPending,
  isAdmin,
  userId,
}: {
  presentations: any[]
  isPremium: boolean
  isPending: boolean
  isAdmin: boolean
  userId: string
}) {
  if (presentations.length === 0) return null

  return (
    <div className="border-t border-gray-100 px-8 py-6">
      <div className="max-w-4xl mx-auto">
        <PresentationsList presentations={presentations} />
      </div>
    </div>
  )
}

function PresentationsList({ presentations }: { presentations: any[] }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {presentations.map((p: any) => (
          <div
            key={p.id}
            className="relative group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <Link href={`/editor/${p.id}`} className="absolute inset-0 z-0" />
            <div className="p-4 relative z-10 pointer-events-none">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate text-sm">
                    {p.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{p.slides?.length || 0} slides</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 z-20">
              <DeletePresentationButton id={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
