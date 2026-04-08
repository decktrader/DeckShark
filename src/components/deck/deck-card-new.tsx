'use client'

import Link from 'next/link'
import type { Deck } from '@/types'
import { DeckArt } from '@/components/deck/deck-art'
import { TradeToggle } from '@/components/deck/trade-toggle'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(0)}`
}

export function DeckCardNew({ deck }: { deck: Deck }) {
  const commanderLabel = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  return (
    <Link href={`/decks/${deck.id}/edit`} className="group block">
      <div className="overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
        <div className="relative">
          <DeckArt
            commanderScryfallId={deck.commander_scryfall_id}
            partnerScryfallId={deck.partner_commander_scryfall_id}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="truncate text-sm font-bold text-white drop-shadow-lg">
              {deck.name}
            </p>
            {commanderLabel && (
              <p className="truncate text-xs text-white/50">{commanderLabel}</p>
            )}
          </div>
        </div>
        <div
          className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-3 py-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60 capitalize">
              {deck.format}
            </span>
            <span className="text-lg font-bold text-emerald-400">
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
