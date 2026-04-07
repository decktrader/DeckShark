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
        {/* Art section — name overlaid */}
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

          {/* Name + commander on art */}
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

        {/* Info bar below art */}
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
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-[10px] capitalize">
                {deck.format}
              </span>
              {deck.power_level && (
                <>
                  <span className="text-muted-foreground text-[10px]">·</span>
                  <span className="text-muted-foreground text-[10px] capitalize">
                    {deck.power_level}
                  </span>
                </>
              )}
            </div>
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

  // Fetch the authenticated user's profile city/province to use as defaults
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
    // Non-critical — browse page works fine without defaults
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
      {/* Compact hero strip */}
      <section className="border-b border-white/5 bg-gradient-to-r from-purple-950/40 via-transparent to-blue-950/40">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-8 sm:py-10">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Trade MTG decks
              <span className="text-primary"> near you</span>
            </h1>
            <p className="text-muted-foreground mt-1 max-w-md text-sm leading-relaxed">
              Browse decks available for local, in-person trades across Canada.
              Always free.
            </p>
          </div>
          <div className="hidden sm:block">
            <Button asChild size="sm" variant="outline">
              <Link href="/register">Sign up free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Browse grid with sidebar */}
      <section className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-6">
          <Suspense>
            <BrowseSidebar
              resultCount={decks.length}
              defaultCity={defaultCity}
              defaultProvince={defaultProvince}
              basePath="/"
            />
          </Suspense>

          {/* Main content */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold">
                  {hasFilters ? 'Matching decks' : 'Recently listed'}
                </h2>
                <span className="text-muted-foreground text-sm">
                  {decks.length} deck{decks.length !== 1 ? 's' : ''} available
                </span>
              </div>
              {/* Value signals */}
              <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>In-person trades only</span>
                <span className="text-white/10">|</span>
                <span>Free to use</span>
                <span className="text-white/10">|</span>
                <span>Prices from Scryfall</span>
              </div>
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
      <section className="border-t border-white/5">
        <div className="container mx-auto max-w-4xl px-4 py-14 text-center">
          <h2 className="text-2xl font-bold">Ready to start trading?</h2>
          <p className="text-muted-foreground mt-2">
            Create an account, import your decks, and find your next trade.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/register">Sign up free</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
