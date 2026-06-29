import Link from 'next/link'
import { DeckArt } from '@/components/deck/deck-art'
import { ColorPips } from '@/components/deck/color-pips'
import { Pfp } from '@/components/ds/pfp'
import type { PublicDeck } from '@/lib/services/decks.server'

/** Whole-dollar USD, a friendly Scryfall guide (e.g. $377). */
function usd(cents: number | null): string | null {
  if (cents == null) return null
  return '$' + Math.round(cents / 100).toLocaleString('en-US')
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[11px] w-[11px]">
      <path d="M12 21s-7-4.5-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.2 1.2 4 2.3 .8-1.1 2-2.3 4-2.3C17 5.5 18.5 9 16.5 12.5 14 16.5 12 21 12 21z" />
    </svg>
  )
}

/**
 * DeckCard — commander-art tile for browse / discovery. Pairs art with the
 * color identity, owner + city, a real interest signal, and a teal value.
 */
export function DeckCard({
  deck,
  interestCount,
}: {
  deck: PublicDeck
  interestCount?: number
}) {
  const commander = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')
  const value = usd(deck.estimated_value_cents)

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="group border-line hover:border-line-2 hover:shadow-card block overflow-hidden rounded-lg border bg-white transition-[transform,box-shadow,border-color] hover:-translate-y-[3px]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0c2030]">
        <DeckArt
          commanderScryfallId={deck.commander_scryfall_id}
          partnerScryfallId={deck.partner_commander_scryfall_id}
          aspect="absolute inset-0 h-full"
        />
        {/* legibility gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[42%] to-[rgba(8,12,18,0.86)]" />

        {interestCount != null && interestCount > 0 && (
          <span className="rounded-pill text-paper absolute top-2.5 left-2.5 z-[2] inline-flex items-center gap-1.5 bg-[rgba(8,12,18,0.55)] px-2.5 py-[3px] font-mono text-[10.5px] font-semibold backdrop-blur-[5px]">
            <HeartIcon />
            {interestCount}
          </span>
        )}

        {deck.color_identity?.length > 0 && (
          <ColorPips
            colors={deck.color_identity}
            onArt
            size={18}
            className="absolute top-2.5 right-2.5 z-[2] flex"
          />
        )}

        <div className="absolute inset-x-3 bottom-3 z-[2]">
          <div className="font-display text-paper text-[15px] leading-tight font-bold">
            {deck.name}
          </div>
          {commander && (
            <div className="text-paper/60 mt-0.5 text-[11.5px]">
              {commander}
            </div>
          )}
        </div>
      </div>

      <div className="border-line flex items-center justify-between gap-2 border-t px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Pfp
            src={deck.owner.avatar_url}
            name={deck.owner.username}
            size={22}
          />
          <span className="text-ink truncate text-xs font-semibold">
            {deck.owner.username}
          </span>
        </div>
        <div className="shrink-0 text-right">
          {deck.owner.city && (
            <div className="text-slate text-[10px]">{deck.owner.city}</div>
          )}
          {value && (
            <div className="text-teal-deep font-mono text-[15px] font-semibold">
              {value}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
