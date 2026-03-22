import Link from 'next/link'
import type { Deck } from '@/types'
import { Button } from '@/components/ui/button'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return ''
  return `$${(cents / 100).toFixed(2)}`
}

export function DeckHeader({
  deck,
  isOwner,
}: {
  deck: Deck
  isOwner: boolean
}) {
  const value = formatPrice(deck.estimated_value_cents)

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold">{deck.name}</h1>
        {deck.description && (
          <p className="text-muted-foreground mt-1">{deck.description}</p>
        )}
        {value && (
          <p className="text-muted-foreground mt-1 text-sm">
            Estimated value: {value}
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
