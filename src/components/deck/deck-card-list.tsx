import type { DeckCard } from '@/types'

function formatPrice(cents: number | null): string {
  if (cents === null) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export function DeckCardList({ cards }: { cards: DeckCard[] }) {
  const commanders = cards.filter((c) => c.is_commander)
  const nonCommanders = cards.filter((c) => !c.is_commander)
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{totalCards} cards</p>
      {commanders.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Commander</h3>
          <ul className="space-y-1">
            {commanders.map((card) => (
              <CardRow key={card.id} card={card} />
            ))}
          </ul>
        </div>
      )}
      <div>
        {commanders.length > 0 && (
          <h3 className="mb-2 text-sm font-semibold">Deck</h3>
        )}
        <ul className="space-y-1">
          {nonCommanders.map((card) => (
            <CardRow key={card.id} card={card} />
          ))}
        </ul>
      </div>
    </div>
  )
}

function CardRow({ card }: { card: DeckCard }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span>
        <span className="text-muted-foreground">{card.quantity}x</span>{' '}
        {card.card_name}
      </span>
      <span className="text-muted-foreground text-xs">
        {formatPrice(card.price_cents)}
      </span>
    </li>
  )
}
