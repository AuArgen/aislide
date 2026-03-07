import { getSettings } from '@/lib/actions/settings'
import { SettingsForm } from '@/components/admin/SettingsForm'

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  // Transform settings array to key-value object for easier use in form
  const settingsMap = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Системалык жөндөөлөр</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-6">API Токендери</h2>
        <SettingsForm initialSettings={settingsMap} />
      </div>
    </div>
  )
}
