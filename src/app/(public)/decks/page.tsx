import { Suspense } from 'react'
import { getPublicDecks } from '@/lib/services/decks.server'
import { BrowseFilters } from '@/components/deck/browse-filters'
import { PublicDeckCard } from '@/components/deck/public-deck-card'
import { PaginationNav } from '@/components/ui/pagination-nav'

export const metadata = {
  title: 'Browse Decks — DeckTrader',
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

  const colorIdentity = params.colorIdentity
    ? params.colorIdentity.split(',').filter(Boolean)
    : undefined

  const { data: allDecks } = await getPublicDecks({
    format: params.format,
    province: params.province,
    city: params.city,
    commander: params.commander,
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

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse decks</h1>
        <p className="text-muted-foreground mt-1">
          MTG decks available for trade across Canada
        </p>
      </div>

      <div className="mb-6">
        <Suspense>
          <BrowseFilters />
        </Suspense>
      </div>

      {pageDecks.length === 0 ? (
        <p className="text-muted-foreground">
          No decks match your filters. Try broadening your search.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground mb-4 text-sm">
            {decks.length} deck{decks.length !== 1 ? 's' : ''} available
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageDecks.map((deck) => (
              <PublicDeckCard key={deck.id} deck={deck} />
            ))}
          </div>
          <PaginationNav
            page={safePage}
            totalPages={totalPages}
            buildUrl={buildUrl}
          />
        </>
      )}
    </main>
  )
}
