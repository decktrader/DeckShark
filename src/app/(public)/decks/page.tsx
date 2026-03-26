import { Suspense } from 'react'
import { getPublicDecks } from '@/lib/services/decks.server'
import { BrowseFilters } from '@/components/deck/browse-filters'
import { PublicDeckCard } from '@/components/deck/public-deck-card'

export const metadata = {
  title: 'Browse Decks — DeckTrader',
  description: 'Find MTG decks available for trade across Canada.',
}

export default async function BrowseDecksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams

  const { data: decks } = await getPublicDecks({
    format: params.format,
    province: params.province,
    city: params.city,
    commander: params.commander,
    minValueCents: params.minValue ? Number(params.minValue) : undefined,
    maxValueCents: params.maxValue ? Number(params.maxValue) : undefined,
  })

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

      {!decks || decks.length === 0 ? (
        <p className="text-muted-foreground">
          No decks match your filters. Try broadening your search.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground mb-4 text-sm">
            {decks.length} deck{decks.length !== 1 ? 's' : ''} available
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <PublicDeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
