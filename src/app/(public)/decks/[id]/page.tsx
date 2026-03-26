import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getPublicDeck,
  getDeckCards,
  getDeckPhotos,
} from '@/lib/services/decks.server'
import { DeckCardList } from '@/components/deck/deck-card-list'
import { DeckStats } from '@/components/deck/deck-stats'
import { Button } from '@/components/ui/button'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export default async function PublicDeckPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: deck } = await getPublicDeck(id)

  if (!deck) notFound()

  const [{ data: cards }, { data: photos }] = await Promise.all([
    getDeckCards(deck.id),
    getDeckPhotos(deck.id),
  ])

  const primaryPhoto = photos?.find((p) => p.is_primary) ?? photos?.[0]

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4">
        <Link
          href="/decks"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Browse decks
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-3xl font-bold">{deck.name}</h1>
            {deck.description && (
              <p className="text-muted-foreground mt-2">{deck.description}</p>
            )}
          </div>

          <DeckStats deck={deck} cards={cards ?? []} />

          {deck.condition_notes && (
            <div>
              <h2 className="mb-1 text-sm font-semibold">Condition notes</h2>
              <p className="text-muted-foreground text-sm">
                {deck.condition_notes}
              </p>
            </div>
          )}

          {primaryPhoto && (
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/deck-photos/${primaryPhoto.storage_path}`}
                alt={deck.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold">Decklist</h2>
            <DeckCardList cards={cards ?? []} />
          </div>
        </div>

        {/* Sidebar — owner info */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h2 className="mb-3 font-semibold">Listed by</h2>
            <Link
              href={`/profile/${deck.owner.username}`}
              className="font-medium hover:underline"
            >
              {deck.owner.username}
            </Link>
            {(deck.owner.city || deck.owner.province) && (
              <p className="text-muted-foreground mt-1 text-sm">
                {[deck.owner.city, deck.owner.province]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            <p className="text-muted-foreground mt-3 text-sm">
              Estimated value:{' '}
              <span className="text-foreground font-medium">
                {formatPrice(deck.estimated_value_cents)}
              </span>
            </p>
            <Button className="mt-4 w-full" asChild>
              <Link href={`/profile/${deck.owner.username}`}>View profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
