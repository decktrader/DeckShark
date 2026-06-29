'use client'

import Link from 'next/link'
import type { Deck } from '@/types'
import { DeckArt } from '@/components/deck/deck-art'
import { TradeToggle } from '@/components/deck/trade-toggle'
import { ColorPips } from '@/components/deck/color-pips'
import { formatPrice } from '@/lib/utils'

export function DeckCardNew({ deck }: { deck: Deck }) {
  const commanderLabel = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  return (
    <Link href={`/decks/${deck.id}/edit`} className="group block">
      <div className="border-line hover:border-line-2 hover:shadow-card overflow-hidden rounded-lg border transition-[transform,box-shadow,border-color] hover:-translate-y-[3px]">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#0c2030]">
          <DeckArt
            commanderScryfallId={deck.commander_scryfall_id}
            partnerScryfallId={deck.partner_commander_scryfall_id}
            aspect="absolute inset-0 h-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[42%] to-[rgba(8,12,18,0.86)]" />
          <span
            className={`absolute top-2 left-2 z-[2] rounded-sm px-[7px] py-[3px] font-mono text-[9px] font-semibold tracking-[0.06em] uppercase ${
              deck.available_for_trade
                ? 'bg-teal text-paper'
                : 'text-paper/70 bg-[rgba(8,12,18,0.6)] backdrop-blur-[4px]'
            }`}
          >
            {deck.available_for_trade ? 'Trading' : 'Not listed'}
          </span>
          {deck.color_identity?.length > 0 && (
            <ColorPips
              colors={deck.color_identity}
              onArt
              size={17}
              className="absolute top-2 right-2 z-[2] flex"
            />
          )}
          <div className="absolute inset-x-3 bottom-2.5 z-[2]">
            <p className="font-display text-paper truncate text-[13.5px] font-bold">
              {deck.name}
            </p>
            {commanderLabel && (
              <p className="text-paper/60 truncate text-[10.5px]">
                {commanderLabel}
              </p>
            )}
          </div>
        </div>
        <div
          className="border-line flex items-center justify-between border-t px-3 py-2"
          onClick={(e) => e.preventDefault()}
        >
          <span className="text-teal-deep font-mono text-sm font-semibold">
            {formatPrice(deck.estimated_value_cents, { decimals: false })}
          </span>
          <TradeToggle
            deckId={deck.id}
            initialValue={deck.available_for_trade}
          />
        </div>
      </div>
    </Link>
  )
}
