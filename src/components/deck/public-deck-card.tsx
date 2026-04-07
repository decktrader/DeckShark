import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeckArt } from '@/components/deck/deck-art'
import type { PublicDeck } from '@/lib/services/decks.server'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export function PublicDeckCard({ deck }: { deck: PublicDeck }) {
  return (
    <Link href={`/decks/${deck.id}`}>
      <Card className="hover:border-primary/50 flex h-full flex-col overflow-hidden transition-colors">
        {deck.commander_scryfall_id && (
          <DeckArt
            commanderScryfallId={deck.commander_scryfall_id}
            partnerScryfallId={deck.partner_commander_scryfall_id}
            aspect="h-28"
          />
        )}
        <CardHeader
          className={`pb-2 ${deck.commander_scryfall_id ? 'pt-3' : ''}`}
        >
          <CardTitle className="text-lg leading-tight">{deck.name}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {deck.owner.username}
            {deck.owner.city && deck.owner.province
              ? ` · ${deck.owner.city}, ${deck.owner.province}`
              : deck.owner.province
                ? ` · ${deck.owner.province}`
                : ''}
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <div>
            {deck.commander_name && (
              <p className="text-muted-foreground mb-1 text-sm">
                {[deck.commander_name, deck.partner_commander_name]
                  .filter(Boolean)
                  .join(' / ')}
              </p>
            )}
            {deck.description && (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {deck.description}
              </p>
            )}
          </div>
          <div className="text-muted-foreground mt-3 flex items-center justify-between text-sm">
            <span>
              <span className="capitalize">{deck.format}</span>
              {deck.archetype && (
                <span className="ml-1">· {deck.archetype}</span>
              )}
            </span>
            <span className="text-foreground font-medium">
              {formatPrice(deck.estimated_value_cents)}
            </span>
          </div>
          {(deck.includes_sleeves || deck.includes_deckbox) && (
            <div className="mt-2 flex gap-1.5">
              {deck.includes_sleeves && (
                <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                  Sleeves
                </span>
              )}
              {deck.includes_deckbox && (
                <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                  Deckbox
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
