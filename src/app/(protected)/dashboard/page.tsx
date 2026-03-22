import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { isOnboardingComplete } from '@/lib/services/users'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await getUserById(authUser.id)

  if (!profile || !isOnboardingComplete(profile)) {
    redirect('/onboarding')
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Welcome, {profile.username}</h1>
      <p className="text-muted-foreground mt-2">
        Your decks will appear here once you start adding them.
      </p>
    </main>
  )
}
