import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PublicDeck } from '@/lib/services/decks.server'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export function PublicDeckCard({ deck }: { deck: PublicDeck }) {
  return (
    <Link href={`/decks/${deck.id}`}>
      <Card className="hover:border-primary/50 flex h-full flex-col transition-colors">
        <CardHeader className="pb-2">
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
                {deck.commander_name}
              </p>
            )}
            {deck.description && (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {deck.description}
              </p>
            )}
          </div>
          <div className="text-muted-foreground mt-3 flex items-center justify-between text-sm">
            <span className="capitalize">{deck.format}</span>
            <span className="text-foreground font-medium">
              {formatPrice(deck.estimated_value_cents)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
