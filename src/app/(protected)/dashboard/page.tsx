import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { getUserDecks } from '@/lib/services/decks.server'
import { getUserWantLists } from '@/lib/services/wantlists.server'
import { getUserTrades } from '@/lib/services/trades.server'
import { isOnboardingComplete } from '@/lib/services/users'
import { DeckCardNew } from '@/components/deck/deck-card-new'
import { Button } from '@/components/ui/button'
import {
  getTotalInterestForUser,
  getUserInterestedDecks,
} from '@/lib/services/deck-interests.server'
import { Heart, MapPin } from 'lucide-react'
import type { WantList } from '@/types'

function scryfallArtUrl(id: string) {
  return `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg`
}

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(0)}`
}

function priceRange(wl: WantList): string {
  if (!wl.min_value_cents && !wl.max_value_cents) return ''
  if (!wl.min_value_cents) return `Up to ${formatPrice(wl.max_value_cents)}`
  if (!wl.max_value_cents) return `${formatPrice(wl.min_value_cents)}+`
  return `${formatPrice(wl.min_value_cents)} – ${formatPrice(wl.max_value_cents)}`
}

const FORMAT_COLORS: Record<string, string> = {
  commander: 'border-violet-500/40 text-violet-300',
  modern: 'border-sky-500/40 text-sky-300',
  standard: 'border-amber-500/40 text-amber-300',
  legacy: 'border-rose-500/40 text-rose-300',
  pauper: 'border-emerald-500/40 text-emerald-300',
  pioneer: 'border-orange-500/40 text-orange-300',
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

  const [
    { data: decks },
    { data: wantLists },
    { data: trades },
    { data: totalInterest },
    { data: wantedDecks },
  ] = await Promise.all([
    getUserDecks(authUser.id),
    getUserWantLists(authUser.id),
    getUserTrades(authUser.id),
    getTotalInterestForUser(authUser.id),
    getUserInterestedDecks(authUser.id),
  ])

  const deckList = decks ?? []
  const wlList = wantLists ?? []
  const activeTrades = (trades ?? []).filter((t) =>
    ['proposed', 'countered', 'accepted'].includes(t.status),
  ).length

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Dashboard
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/decks/new">New deck</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/want-lists/new">New want list</Link>
          </Button>
        </div>
      </div>

      {/* Stat boxes */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="overflow-hidden rounded-xl border border-white/5">
          <div className="h-1 w-full bg-gradient-to-r from-violet-500/80 via-violet-500/30 to-transparent" />
          <div className="p-4 text-center">
            <p className="text-2xl font-black sm:text-3xl">{deckList.length}</p>
            <p className="text-muted-foreground text-xs">Decks</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5">
          <div className="h-1 w-full bg-gradient-to-r from-sky-500/80 via-sky-500/30 to-transparent" />
          <div className="p-4 text-center">
            <p className="text-2xl font-black sm:text-3xl">{activeTrades}</p>
            <p className="text-muted-foreground text-xs">Active trades</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500/80 via-emerald-500/30 to-transparent" />
          <div className="p-4 text-center">
            <p className="text-2xl font-black sm:text-3xl">
              {profile.completed_trades}
            </p>
            <p className="text-muted-foreground text-xs">Completed</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5">
          <div className="h-1 w-full bg-gradient-to-r from-amber-500/80 via-amber-500/30 to-transparent" />
          <div className="p-4 text-center">
            <p className="text-2xl font-black sm:text-3xl">
              {wlList.filter((w) => w.status === 'active').length}
            </p>
            <p className="text-muted-foreground text-xs">Want lists</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5">
          <div className="h-1 w-full bg-gradient-to-r from-pink-500/80 via-pink-500/30 to-transparent" />
          <div className="p-4 text-center">
            <p className="text-2xl font-black sm:text-3xl">
              {totalInterest ?? 0}
            </p>
            <p className="text-muted-foreground text-xs">Interested</p>
          </div>
        </div>
      </div>

      {/* Decks section */}
      <section className="overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[2%] to-transparent">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">Your decks</h2>
            <p className="text-muted-foreground text-xs">
              {deckList.filter((d) => d.available_for_trade).length} of{' '}
              {deckList.length} available for trade
            </p>
          </div>
        </div>
        <div className="px-6 pb-6">
          {deckList.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No decks yet.{' '}
              <Link href="/decks/new" className="text-primary underline">
                Create one
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
              {deckList.map((d) => (
                <DeckCardNew key={d.id} deck={d} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Want lists section */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[2%] to-transparent">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">Want lists</h2>
            <p className="text-muted-foreground text-xs">
              {wlList.filter((w) => w.status === 'active').length} active ·{' '}
              {wlList.filter((w) => w.status === 'fulfilled').length} fulfilled
            </p>
          </div>
        </div>
        <div className="px-6 pb-6">
          {wlList.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No want lists yet.{' '}
              <Link href="/want-lists/new" className="text-primary underline">
                Create one
              </Link>{' '}
              to let others know what you&apos;re looking for.
            </p>
          ) : (
            <div className="space-y-2">
              {wlList.map((wl) => (
                <Link key={wl.id} href={`/want-lists/${wl.id}`}>
                  <div className="rounded-lg border border-white/5 p-4 transition-colors hover:border-white/15">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{wl.title}</p>
                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                          {wl.format && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${FORMAT_COLORS[wl.format] ?? 'border-white/20 text-white/60'}`}
                            >
                              {wl.format}
                            </span>
                          )}
                          {wl.commander_name && (
                            <span>{wl.commander_name}</span>
                          )}
                          {priceRange(wl) && <span>{priceRange(wl)}</span>}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold ${wl.status === 'active' ? 'text-green-400' : 'text-muted-foreground'}`}
                      >
                        {wl.status === 'active' ? 'Active' : 'Fulfilled'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Wanted decks section */}
      {(wantedDecks ?? []).length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[2%] to-transparent">
          <div className="px-6 py-5">
            <h2 className="text-lg font-bold">Decks you want</h2>
            <p className="text-muted-foreground text-xs">
              {wantedDecks!.length} deck{wantedDecks!.length !== 1 ? 's' : ''}{' '}
              you&apos;ve voted for shipping
            </p>
          </div>
          <div className="divide-y divide-white/5 px-6 pb-4">
            {wantedDecks!.map((d) => (
              <Link
                key={d.deck_id}
                href={`/decks/${d.deck_id}`}
                className="flex items-center gap-4 py-3 transition-colors hover:bg-white/[2%]"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  {d.commander_scryfall_id ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${scryfallArtUrl(d.commander_scryfall_id)})`,
                      }}
                    />
                  ) : (
                    <div className="bg-muted h-full w-full" />
                  )}
                  <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 to-transparent p-1">
                    <Heart className="h-3.5 w-3.5 fill-pink-400 text-pink-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{d.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {d.commander_name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <MapPin className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground text-[10px]">
                      {d.owner_username} · {d.owner_city}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-emerald-400">
                    {d.estimated_value_cents
                      ? `$${(d.estimated_value_cents / 100).toFixed(0)}`
                      : '—'}
                  </p>
                  <p className="text-muted-foreground text-[10px] capitalize">
                    {d.format}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
