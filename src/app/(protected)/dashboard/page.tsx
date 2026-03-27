import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { getUserDecks } from '@/lib/services/decks.server'
import { getUserWantLists } from '@/lib/services/wantlists.server'
import { isOnboardingComplete } from '@/lib/services/users'
import { DeckGrid } from '@/components/deck/deck-grid'
import { Button } from '@/components/ui/button'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

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

  const [{ data: decks }, { data: wantLists }] = await Promise.all([
    getUserDecks(authUser.id),
    getUserWantLists(authUser.id),
  ])

  return (
    <main className="container mx-auto max-w-4xl space-y-12 px-4 py-8">
      {/* Decks */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your decks</h1>
          <Button asChild>
            <Link href="/decks/new">New deck</Link>
          </Button>
        </div>
        <DeckGrid decks={decks ?? []} showTradeToggle />
      </section>

      {/* Want lists */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Want lists</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/want-lists/new">New want list</Link>
          </Button>
        </div>

        {!wantLists || wantLists.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No want lists yet.{' '}
            <Link href="/want-lists/new" className="underline">
              Create one
            </Link>{' '}
            to let others know what you&apos;re looking for.
          </p>
        ) : (
          <div className="space-y-2">
            {wantLists.map((wl) => (
              <Link key={wl.id} href={`/want-lists/${wl.id}`}>
                <div className="bg-card hover:border-primary/50 rounded-lg border p-4 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{wl.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {wl.format && (
                          <span className="capitalize">{wl.format}</span>
                        )}
                        {wl.format && wl.commander_name && ' · '}
                        {wl.commander_name && wl.commander_name}
                        {(wl.min_value_cents || wl.max_value_cents) &&
                          ` · ${formatPrice(wl.min_value_cents)} – ${wl.max_value_cents ? formatPrice(wl.max_value_cents) : 'any'}`}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold ${wl.status === 'active' ? 'text-green-400' : 'text-muted-foreground'}`}
                    >
                      {wl.status === 'active' ? 'Active' : 'Fulfilled'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
