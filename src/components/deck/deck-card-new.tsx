'use client'

import Link from 'next/link'
import type { Deck } from '@/types'
import { TradeToggle } from '@/components/deck/trade-toggle'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(0)}`
}

function scryfallArtUrl(scryfallId: string): string {
  return `https://cards.scryfall.io/art_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
}

export function DeckCardNew({ deck }: { deck: Deck }) {
  return (
    <Link href={`/decks/${deck.id}/edit`} className="group block">
      <div className="overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
        <div className="relative">
          {deck.commander_scryfall_id ? (
            <div
              className="aspect-[5/4] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(${scryfallArtUrl(deck.commander_scryfall_id)})`,
              }}
            />
          ) : (
            <div className="bg-muted aspect-[5/4] w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="truncate text-sm font-bold text-white drop-shadow-lg">
              {deck.name}
            </p>
            {deck.commander_name && (
              <p className="truncate text-xs text-white/50">
                {deck.commander_name}
              </p>
            )}
          </div>
        </div>
        <div
          className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs capitalize">
              {deck.format}
            </span>
            <span className="text-primary text-sm font-bold">
              {formatPrice(deck.estimated_value_cents)}
            </span>
          </div>
          <TradeToggle
            deckId={deck.id}
            initialValue={deck.available_for_trade}
          />
        </div>
      </div>
    </Link>
  )
}
