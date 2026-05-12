import Link from 'next/link'
import type { Deck } from '@/types'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export function DeckHeader({
  deck,
  isOwner,
}: {
  deck: Deck
  isOwner: boolean
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold">{deck.name}</h1>
        {deck.description && (
          <p className="text-muted-foreground mt-1">{deck.description}</p>
        )}
        {deck.estimated_value_cents != null &&
          deck.estimated_value_cents > 0 && (
            <p className="text-muted-foreground mt-1 text-sm">
              Value: {formatPrice(deck.estimated_value_cents)}
            </p>
          )}
      </div>
      {isOwner && (
        <Button asChild variant="outline" size="sm">
          <Link href={`/decks/${deck.id}/edit`}>Edit</Link>
        </Button>
      )}
    </div>
  )
}
