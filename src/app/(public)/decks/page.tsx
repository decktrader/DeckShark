import Link from 'next/link'
import { Suspense } from 'react'
import { getPublicDecks } from '@/lib/services/decks.server'
import { getUserById } from '@/lib/services/users.server'
import { createClient } from '@/lib/supabase/server'
import { BrowseSidebar } from '@/components/deck/browse-sidebar'
import { DeckCard } from '@/components/ds/deck-card'
import { SortBar } from '@/components/deck/sort-bar'
import { PaginationNav } from '@/components/ui/pagination-nav'
import { Button } from '@/components/ui/button'
import { getInterestCountsForDecks } from '@/lib/services/deck-interests.server'

export const metadata = {
  title: 'Browse Decks — DeckShark',
  description: 'Find MTG decks available for trade across Canada.',
}

const PAGE_SIZE = 24

export default async function BrowseDecksPage({
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

  // Batch-fetch interest counts for this page of decks
  const { data: interestCounts } = await getInterestCountsForDecks(
    pageDecks.map((d) => d.id),
  )
  const totalPages = Math.max(1, Math.ceil(totalDecks / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

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
    return str ? `/decks?${str}` : '/decks'
  }

  const isListView = params.view === 'list'

  return (
    <main className="mx-auto max-w-[1280px] px-[30px] pt-[26px] pb-0">
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.02em]">
            Browse decks
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            <b className="text-terra-deep font-bold">
              {totalDecks.toLocaleString('en-US')}
            </b>{' '}
            complete deck{totalDecks !== 1 ? 's' : ''} available to trade right
            now
          </p>
        </div>
        <Button asChild variant="brass" size="sm">
          <Link href="/want-lists/new">Post a want list</Link>
        </Button>
      </div>

      {/* Mobile filter bar — above the grid */}
      <div className="mb-4 lg:hidden">
        <Suspense>
          <BrowseSidebar
            resultCount={totalDecks}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
            mobileOnly
          />
        </Suspense>
      </div>

      <div className="flex gap-[26px]">
        {/* Desktop sidebar */}
        <Suspense>
          <BrowseSidebar
            resultCount={totalDecks}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
            desktopOnly
          />
        </Suspense>

        {/* Main content */}
        <div className="flex-1">
          <div className="mb-4">
            <Suspense>
              <SortBar />
            </Suspense>
          </div>
          {pageDecks.length === 0 ? (
            <div className="py-16 text-center">
              {params.city || params.province ? (
                <>
                  <div className="bg-paper-2 text-slate mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-display mb-2 text-xl font-bold">
                    Be the first trader in {params.city || params.province}
                  </h3>
                  <p className="text-ink-2 mx-auto mb-6 max-w-md text-sm">
                    No decks listed here yet. List yours and we&apos;ll notify
                    local players when they join. Early listers get the most
                    visibility.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button asChild variant="terra" size="sm">
                      <Link href="/decks/new">List a deck</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/decks">Browse all cities</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-ink-2 text-lg">
                  No decks match your filters. Try broadening your search.
                </p>
              )}
            </div>
          ) : (
            <>
              <div
                className={
                  isListView
                    ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
                    : 'grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4'
                }
              >
                {pageDecks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    interestCount={interestCounts?.[deck.id] ?? 0}
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
    </main>
  )
}
