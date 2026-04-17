import Link from 'next/link'
import Image from 'next/image'
import { DeckArt } from '@/components/deck/deck-art'
import { Heart } from 'lucide-react'
import type { PublicDeck } from '@/lib/services/decks.server'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '\u2014'
  return `$${(cents / 100).toFixed(2)}`
}

export function DeckBrowseCard({
  deck,
  interestCount,
  listView,
}: {
  deck: PublicDeck
  interestCount: number
  listView?: boolean
}) {
  const commanderLabel = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  const ownerInitial = deck.owner.username.charAt(0).toUpperCase()
  const location = deck.owner.city
    ? deck.owner.city
    : (deck.owner.province ?? '')

  const avatar = deck.owner.avatar_url ? (
    <Image
      src={deck.owner.avatar_url}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="bg-primary/40 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white">
      {ownerInitial}
    </div>
  )

  return (
    <Link href={`/decks/${deck.id}`} className="group block">
      {/* Mobile: compact V4D grid card */}
      {!listView && (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[3%] p-2.5 transition-all hover:border-white/15 lg:hidden">
          <div className="flex gap-2.5">
            {deck.commander_scryfall_id ? (
              <img
                src={`https://cards.scryfall.io/art_crop/front/${deck.commander_scryfall_id[0]}/${deck.commander_scryfall_id[1]}/${deck.commander_scryfall_id}.jpg`}
                alt={deck.commander_name ?? ''}
                className="h-14 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
              />
            ) : (
              <div className="bg-muted h-14 w-14 shrink-0 rounded-lg" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{deck.name}</p>
              {commanderLabel && (
                <p className="text-muted-foreground truncate text-[10px]">
                  {commanderLabel}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1">
                <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] text-violet-300 capitalize">
                  {deck.format}
                </span>
                {location && (
                  <span className="text-[9px] text-white/30">{location}</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {avatar}
              <span className="text-[10px]">{deck.owner.username}</span>
            </div>
            <p className="text-lg font-extrabold text-emerald-400">
              {formatPrice(deck.estimated_value_cents)}
            </p>
          </div>
        </div>
      )}

      {/* Mobile: compact list row */}
      {listView && (
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-1 py-1.5 lg:hidden">
          {deck.commander_scryfall_id ? (
            <img
              src={`https://cards.scryfall.io/art_crop/front/${deck.commander_scryfall_id[0]}/${deck.commander_scryfall_id[1]}/${deck.commander_scryfall_id}.jpg`}
              alt={deck.commander_name ?? ''}
              className="h-8 w-8 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="bg-muted h-8 w-8 shrink-0 rounded" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <p className="truncate text-[12px] font-semibold">{deck.name}</p>
              <span className="shrink-0 text-[9px] text-violet-300 capitalize">
                {deck.format}
              </span>
            </div>
            <p className="text-muted-foreground truncate text-[10px]">
              {commanderLabel ? `${commanderLabel} · ` : ''}
              {deck.owner.username}
              {location ? ` · ${location}` : ''}
            </p>
          </div>
          <p className="shrink-0 text-[13px] font-bold text-emerald-400">
            {formatPrice(deck.estimated_value_cents)}
          </p>
        </div>
      )}

      {/* Desktop: full art card */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5 lg:block">
        <div className="relative">
          <DeckArt
            commanderScryfallId={deck.commander_scryfall_id}
            partnerScryfallId={deck.partner_commander_scryfall_id}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="truncate text-sm font-bold text-white drop-shadow-lg">
              {deck.name}
            </p>
            {commanderLabel && (
              <p className="truncate text-xs text-white/50">{commanderLabel}</p>
            )}
          </div>
        </div>
        <div className="border-t border-white/5 bg-white/[3%] px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {avatar}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {deck.owner.username}
              </p>
              <p className="text-muted-foreground truncate text-[10px]">
                {deck.owner.city && deck.owner.province
                  ? `${deck.owner.city}, ${deck.owner.province}`
                  : (deck.owner.province ?? '')}
              </p>
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-lg font-bold text-emerald-400">
              {formatPrice(deck.estimated_value_cents)}
            </p>
            <p className="text-muted-foreground text-[10px] capitalize">
              {deck.format}
            </p>
          </div>
        </div>
        {interestCount > 0 && (
          <div className="flex items-center gap-1 border-t border-white/5 bg-white/[2%] px-4 py-1.5">
            <Heart className="h-3 w-3 text-pink-400" />
            <span className="text-[10px] text-pink-400/80">
              {interestCount} interested
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
