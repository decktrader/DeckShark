import Link from 'next/link'
import type { Deck } from '@/types'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { DeckArt } from '@/components/deck/deck-art'
import { TradeToggle } from '@/components/deck/trade-toggle'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export function DeckGrid({
  decks,
  showTradeToggle = false,
}: {
  decks: Deck[]
  showTradeToggle?: boolean
}) {
  if (decks.length === 0) {
    return (
      <p className="text-muted-foreground">
        No decks yet. Create your first one!
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <Link key={deck.id} href={`/decks/${deck.id}/edit`}>
          <Card className="hover:border-primary/50 overflow-hidden transition-colors">
            {/* Commander art banner */}
            {deck.commander_scryfall_id && (
              <DeckArt
                commanderScryfallId={deck.commander_scryfall_id}
                partnerScryfallId={deck.partner_commander_scryfall_id}
                aspect="h-28"
              />
            )}
            <CardContent
              className={deck.commander_scryfall_id ? 'pt-3' : 'pt-6'}
            >
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight">
                  {deck.name}
                </CardTitle>
                {showTradeToggle && (
                  <TradeToggle
                    deckId={deck.id}
                    initialValue={deck.available_for_trade}
                  />
                )}
              </div>
              <div className="text-muted-foreground mt-2 flex items-center justify-between text-sm">
                <span className="capitalize">{deck.format}</span>
                <span>{formatPrice(deck.estimated_value_cents)}</span>
              </div>
              {deck.commander_name && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {[deck.commander_name, deck.partner_commander_name]
                    .filter(Boolean)
                    .join(' / ')}
                </p>
              )}
              {deck.description && (
                <p className="text-muted-foreground mt-1 truncate text-xs">
                  {deck.description}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
