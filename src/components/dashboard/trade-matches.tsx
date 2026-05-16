'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { TradeMatchWithDetails } from '@/lib/services/trade-matches.server'

function scryfallArtUrl(id: string) {
  return `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg`
}

function MatchCard({
  match,
  onDismiss,
}: {
  match: TradeMatchWithDetails
  onDismiss: (id: string) => void
}) {
  const yourDeck = match.user_deck
  const theirDeck = match.matched_deck
  const owner = theirDeck.owner

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5">
      {/* Art hero — both commanders side by side */}
      <div className="relative flex h-[90px]">
        {/* Your deck art */}
        <div className="relative flex flex-1 items-end">
          {yourDeck.commander_scryfall_id ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${scryfallArtUrl(yourDeck.commander_scryfall_id)})`,
              }}
            />
          ) : (
            <div className="bg-muted absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative z-10 p-3">
            <p className="text-xs font-bold drop-shadow-md">{yourDeck.name}</p>
            <p className="text-xs font-semibold text-emerald-400">
              {formatPrice(yourDeck.estimated_value_cents, { decimals: false })}
            </p>
          </div>
        </div>

        {/* VS badge — color coded by match quality */}
        <div className="absolute top-3 left-1/2 z-20 -translate-x-1/2">
          <div
            className={`flex h-10 w-10 flex-col items-center justify-center rounded-full border-2 bg-[#18181b] ${
              match.match_score >= 95
                ? 'border-amber-400/60'
                : match.match_score >= 85
                  ? 'border-emerald-400/50'
                  : 'border-violet-500/40'
            }`}
          >
            <span
              className={`text-[11px] leading-none font-black ${
                match.match_score >= 95
                  ? 'text-amber-400'
                  : match.match_score >= 85
                    ? 'text-emerald-400'
                    : 'text-violet-400'
              }`}
            >
              {match.match_score}%
            </span>
            <span className="text-[7px] text-[#71717a]">match</span>
          </div>
        </div>

        {/* Their deck art */}
        <div className="relative flex flex-1 items-end">
          {theirDeck.commander_scryfall_id ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${scryfallArtUrl(theirDeck.commander_scryfall_id)})`,
              }}
            />
          ) : (
            <div className="bg-muted absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative z-10 p-3">
            <p className="text-xs font-bold drop-shadow-md">{theirDeck.name}</p>
            <p className="text-xs font-semibold text-emerald-400">
              {formatPrice(theirDeck.estimated_value_cents, {
                decimals: false,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-3 py-2.5">
        <p className="text-muted-foreground text-center text-[11px]">
          <span className="font-semibold text-white">{owner.username}</span> in{' '}
          {owner.city}
          {match.value_diff_cents > 0 &&
            ` · ${formatPrice(match.value_diff_cents, { decimals: false })} cash balances this trade`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex border-t border-white/5">
        <button
          onClick={(e) => {
            e.preventDefault()
            onDismiss(match.id)
          }}
          className="flex-1 border-r border-white/5 py-2.5 text-[11px] font-semibold text-[#52525b] transition-colors hover:bg-white/[0.03] hover:text-[#a1a1aa]"
        >
          Skip
        </button>
        <Link
          href={`/decks/${theirDeck.id}`}
          className="flex-1 py-2.5 text-center text-[11px] font-semibold text-violet-400 transition-colors hover:bg-violet-500/[0.08]"
        >
          View & Trade &rarr;
        </Link>
      </div>
    </div>
  )
}

export function TradeMatches({
  initialMatches,
}: {
  initialMatches: TradeMatchWithDetails[]
}) {
  const [matches, setMatches] = useState(initialMatches)

  async function handleDismiss(matchId: string) {
    setMatches((prev) => prev.filter((m) => m.id !== matchId))
    try {
      const { dismissTradeMatch } = await import('@/lib/services/trade-matches')
      await dismissTradeMatch(matchId)
    } catch {
      // Non-critical
    }
  }

  if (matches.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-bold">Trade matches</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onDismiss={handleDismiss} />
        ))}
      </div>
    </section>
  )
}
