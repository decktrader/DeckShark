import type { Deck, DeckCard } from '@/types'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export function DeckStats({ deck, cards }: { deck: Deck; cards: DeckCard[] }) {
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const uniqueCards = cards.length
  const commanders = cards.filter((c) => c.is_commander)

  return (
    <div className="flex flex-wrap gap-6 text-sm">
      <div>
        <span className="text-muted-foreground">Format</span>
        <p className="font-medium capitalize">{deck.format}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Cards</span>
        <p className="font-medium">
          {totalCards} ({uniqueCards} unique)
        </p>
      </div>
      {commanders.length > 0 && (
        <div>
          <span className="text-muted-foreground">Commander</span>
          <p className="font-medium">
            {commanders.map((c) => c.card_name).join(', ')}
          </p>
        </div>
      )}
      <div>
        <span className="text-muted-foreground">Estimated value</span>
        <p className="font-medium">{formatPrice(deck.estimated_value_cents)}</p>
      </div>
    </div>
  )
}
