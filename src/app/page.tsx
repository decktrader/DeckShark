import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPublicDecks } from '@/lib/services/decks.server'
import type { PublicDeck } from '@/lib/services/decks.server'
import { getUserById } from '@/lib/services/users.server'
import { createClient } from '@/lib/supabase/server'
import { BrowseSidebar } from '@/components/deck/browse-sidebar'
import { PaginationNav } from '@/components/ui/pagination-nav'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'DeckShark — Trade MTG Decks Near You',
  description:
    'Find local Magic: The Gathering players and trade decks in person. Browse trade-available decks across Canada.',
  openGraph: {
    title: 'DeckShark — Trade MTG Decks Near You',
    description:
      'Find local Magic: The Gathering players and trade decks in person. Browse trade-available decks across Canada.',
    type: 'website',
  },
}

const PAGE_SIZE = 24

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '\u2014'
  return `$${(cents / 100).toFixed(2)}`
}

function scryfallArtUrl(scryfallId: string): string {
  return `https://cards.scryfall.io/art_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
}

function DeckCard({ deck }: { deck: PublicDeck }) {
  return (
    <Link href={`/decks/${deck.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
        <div className="relative">
          {deck.commander_scryfall_id ? (
            <div
              className="aspect-[5/4] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(${scryfallArtUrl(deck.commander_scryfall_id)})`,
              }}
            />
          ) : (
            <div className="bg-muted aspect-[5/4] w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="truncate text-sm font-bold text-white drop-shadow-lg">
              {deck.name}
            </p>
            {deck.commander_name && (
              <p className="truncate text-xs text-white/50">
                {deck.commander_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {deck.owner.avatar_url ? (
              <img
                src={deck.owner.avatar_url}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="bg-primary/40 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white">
                {deck.owner.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {deck.owner.username}
              </p>
              <p className="text-muted-foreground truncate text-[10px]">
                {deck.owner.city && deck.owner.province
                  ? `${deck.owner.city}, ${deck.owner.province}`
                  : (deck.owner.province ?? '')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-primary text-sm font-bold">
              {formatPrice(deck.estimated_value_cents)}
            </p>
            <span className="text-muted-foreground text-[10px] capitalize">
              {deck.format}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))

  let defaultCity: string | null = null
  let defaultProvince: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await getUserById(authUser.id)
      defaultCity = profile?.city ?? null
      defaultProvince = profile?.province ?? null
    }
  } catch {
    /* non-critical */
  }

  const colorIdentity = params.colorIdentity
    ? params.colorIdentity.split(',').filter(Boolean)
    : undefined

  const { data: allDecks } = await getPublicDecks({
    format: params.format,
    province: params.province,
    city: params.city,
    commander: params.commander,
    q: params.q,
    minValueCents: params.minValue ? Number(params.minValue) : undefined,
    maxValueCents: params.maxValue ? Number(params.maxValue) : undefined,
    powerLevel: params.powerLevel,
    colorIdentity,
    archetype: params.archetype,
    sortBy: params.sortBy as
      | import('@/lib/services/decks.server').SortOption
      | undefined,
  })

  const decks = allDecks ?? []
  const totalPages = Math.max(1, Math.ceil(decks.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageDecks = decks.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const hasFilters =
    params.format ||
    params.province ||
    params.city ||
    params.commander ||
    params.minValue ||
    params.maxValue ||
    params.powerLevel ||
    params.colorIdentity ||
    params.archetype ||
    params.sortBy

  // Pick 2 random featured decks (that have commander art), rotating daily
  const halfDay = Math.floor(Date.now() / (1000 * 60 * 60 * 12))
  const withArt = decks.filter((d) => d.commander_scryfall_id)
  const featured: PublicDeck[] = []
  if (withArt.length > 0) {
    const i1 = halfDay % withArt.length
    featured.push(withArt[i1])
    if (withArt.length > 1) {
      const i2 = (halfDay + 1) % withArt.length
      featured.push(withArt[i2 === i1 ? (i2 + 1) % withArt.length : i2])
    }
  }

  function buildUrl(p: number) {
    const qs = new URLSearchParams()
    if (params.format) qs.set('format', params.format)
    if (params.province) qs.set('province', params.province)
    if (params.city) qs.set('city', params.city)
    if (params.commander) qs.set('commander', params.commander)
    if (params.minValue) qs.set('minValue', params.minValue)
    if (params.maxValue) qs.set('maxValue', params.maxValue)
    if (params.powerLevel) qs.set('powerLevel', params.powerLevel)
    if (params.colorIdentity) qs.set('colorIdentity', params.colorIdentity)
    if (params.archetype) qs.set('archetype', params.archetype)
    if (params.sortBy) qs.set('sortBy', params.sortBy)
    if (p > 1) qs.set('page', String(p))
    const str = qs.toString()
    return str ? `/?${str}` : '/'
  }

  return (
    <main>
      {/* Hero — steps left, two featured decks right, blurred art background */}
      <section className="relative overflow-hidden border-b border-white/5">
        {featured[0]?.commander_scryfall_id && (
          <>
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center blur-3xl"
              style={{
                backgroundImage: `url(${scryfallArtUrl(featured[0].commander_scryfall_id)})`,
              }}
            />
            <div className="absolute inset-0 bg-black/75" />
          </>
        )}

        <div className="relative container mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-3xl leading-tight font-black tracking-tight sm:text-4xl lg:text-5xl">
              Your next deck
              <br />
              <span className="text-primary">is already listed</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed sm:text-base">
              DeckShark connects MTG players for local deck trades. Browse
              what&apos;s available, propose a swap, and meet up.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-sm font-black text-purple-400">
                  1
                </div>
                <div>
                  <p className="font-semibold">Browse decks near you</p>
                  <p className="text-muted-foreground text-sm">
                    Filter by format, commander, city, and price range
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sm font-black text-sky-400">
                  2
                </div>
                <div>
                  <p className="font-semibold">Propose a trade</p>
                  <p className="text-muted-foreground text-sm">
                    Offer your decks, add cash to balance value, send a message
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-black text-emerald-400">
                  3
                </div>
                <div>
                  <p className="font-semibold">Meet up and trade</p>
                  <p className="text-muted-foreground text-sm">
                    Share contact info, meet locally, and swap decks in person
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button asChild size="lg" className="h-14 px-8 text-lg">
                <Link href="#browse">Browse decks now</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-14 px-8 text-lg"
              >
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          </div>

          {/* Two featured decks */}
          {featured.length > 0 && (
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {featured.map(
                  (deck) =>
                    deck.commander_scryfall_id && (
                      <Link
                        key={deck.id}
                        href={`/decks/${deck.id}`}
                        className="group block"
                      >
                        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-purple-500/10 transition-all hover:border-white/20">
                          <div className="relative">
                            <div
                              className="aspect-[5/4] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                              style={{
                                backgroundImage: `url(${scryfallArtUrl(deck.commander_scryfall_id)})`,
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <p className="truncate text-sm font-bold text-white drop-shadow-lg">
                                {deck.name}
                              </p>
                              <p className="truncate text-xs text-white/60">
                                {deck.commander_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/5 bg-white/[4%] px-4 py-2.5 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                              {deck.owner.avatar_url ? (
                                <img
                                  src={deck.owner.avatar_url}
                                  alt=""
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="bg-primary/40 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white">
                                  {deck.owner.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                  {deck.owner.username}
                                </p>
                                <p className="text-muted-foreground truncate text-[10px]">
                                  {deck.owner.city}, {deck.owner.province}
                                </p>
                              </div>
                            </div>
                            <p className="text-primary text-sm font-bold">
                              {formatPrice(deck.estimated_value_cents)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ),
                )}
              </div>
              <p className="text-muted-foreground mt-3 text-center text-xs">
                Featured decks · {decks.length} total available
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Browse grid with sidebar */}
      <section id="browse" className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-6">
          <Suspense>
            <BrowseSidebar
              resultCount={decks.length}
              defaultCity={defaultCity}
              defaultProvince={defaultProvince}
              basePath="/"
            />
          </Suspense>

          <div className="flex-1">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-xl font-bold">
                {hasFilters ? 'Matching decks' : 'All decks'}
              </h2>
              <span className="text-muted-foreground text-sm">
                {decks.length} available
              </span>
            </div>

            {pageDecks.length === 0 ? (
              <p className="text-muted-foreground py-20 text-center text-lg">
                No decks match your filters. Try broadening your search.
              </p>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {pageDecks.map((deck) => (
                    <DeckCard key={deck.id} deck={deck} />
                  ))}
                </div>
                <PaginationNav
                  page={safePage}
                  totalPages={totalPages}
                  buildUrl={buildUrl}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/5 py-10 text-center">
        <p className="text-muted-foreground text-sm">
          Ready to trade?{' '}
          <Link href="/register" className="text-primary font-medium underline">
            Create a free account
          </Link>
        </p>
      </section>
    </main>
  )
}
