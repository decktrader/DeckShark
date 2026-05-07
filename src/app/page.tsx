import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPublicDecks } from '@/lib/services/decks.server'
import { getUserById } from '@/lib/services/users.server'
import { createClient } from '@/lib/supabase/server'
import { BrowseSidebar } from '@/components/deck/browse-sidebar'
import { DeckBrowseCard } from '@/components/deck/deck-browse-card'
import { SortBar } from '@/components/deck/sort-bar'
import { PaginationNav } from '@/components/ui/pagination-nav'
import { getInterestCountsForDecks } from '@/lib/services/deck-interests.server'
import { HeroSection } from '@/components/hero/hero-section'

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))

  let defaultCity: string | null = null
  let defaultProvince: string | null = null
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      isLoggedIn = true
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

  const { data: result } = await getPublicDecks({
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
    page,
    pageSize: PAGE_SIZE,
  })

  const pageDecks = result?.decks ?? []
  const totalDecks = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalDecks / PAGE_SIZE))

  // Batch-fetch interest counts for this page of decks
  const { data: interestCounts } = await getInterestCountsForDecks(
    pageDecks.map((d) => d.id),
  )
  const safePage = Math.min(page, totalPages)

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
      {/* Hero — map, stats, featured, ticker */}
      <HeroSection />

      {/* Browse grid with sidebar */}
      <section id="browse" className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4 lg:mb-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">
              {hasFilters ? 'Matching decks' : 'All decks'}
            </h2>
            <span className="text-muted-foreground text-sm">
              {totalDecks} available
            </span>
          </div>
        </div>

        {/* Mobile filter bar */}
        <div className="mb-4 lg:hidden">
          <Suspense>
            <BrowseSidebar
              resultCount={totalDecks}
              defaultCity={defaultCity}
              defaultProvince={defaultProvince}
              basePath="/"
              mobileOnly
            />
          </Suspense>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <Suspense>
            <BrowseSidebar
              resultCount={totalDecks}
              defaultCity={defaultCity}
              defaultProvince={defaultProvince}
              basePath="/"
              desktopOnly
            />
          </Suspense>

          <div className="flex-1">
            <div className="mb-4">
              <Suspense>
                <SortBar basePath="/" />
              </Suspense>
            </div>
            {pageDecks.length === 0 ? (
              <p className="text-muted-foreground py-20 text-center text-lg">
                No decks match your filters. Try broadening your search.
              </p>
            ) : (
              <>
                <div
                  className={
                    params.view === 'list'
                      ? 'flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 xl:grid-cols-4'
                      : 'grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4'
                  }
                >
                  {pageDecks.map((deck) => (
                    <DeckBrowseCard
                      key={deck.id}
                      deck={deck}
                      interestCount={interestCounts?.[deck.id] ?? 0}
                      listView={params.view === 'list'}
                    />
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
      {!isLoggedIn && (
        <section className="border-t border-white/5 py-10 text-center">
          <p className="text-muted-foreground text-sm">
            Ready to trade?{' '}
            <Link
              href="/register"
              className="text-primary font-medium underline"
            >
              Create a free account
            </Link>
          </p>
        </section>
      )}
    </main>
  )
}
