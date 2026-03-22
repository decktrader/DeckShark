import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { getUserDecks } from '@/lib/services/decks.server'
import { isOnboardingComplete } from '@/lib/services/users'
import { DeckGrid } from '@/components/deck/deck-grid'
import { Button } from '@/components/ui/button'

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

  const { data: decks } = await getUserDecks(authUser.id)

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your decks</h1>
        <Button asChild>
          <Link href="/decks/new">New deck</Link>
        </Button>
      </div>
      <DeckGrid decks={decks ?? []} />
    </main>
  )
}
