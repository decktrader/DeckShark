import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { SettingsForm } from '@/components/settings-form'
import { AccountDangerZone } from '@/components/account-danger-zone'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await getUserById(authUser.id)

  if (!profile) redirect('/login')

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-black tracking-tight">Settings</h1>
      <SettingsForm user={profile} />
      <div className="mt-6 sm:ml-[calc(14rem+1.5rem)]">
        <AccountDangerZone />
      </div>
    </main>
  )
}
