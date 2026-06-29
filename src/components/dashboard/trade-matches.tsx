'use client'

import { useState } from 'react'
import Link from 'next/link'
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

  const badgeTone =
    match.match_score >= 95
      ? 'border-brass text-brass-deep'
      : match.match_score >= 85
        ? 'border-teal text-teal-deep'
        : 'border-terra text-terra-deep'

  return (
    <div className="border-line overflow-hidden rounded-md border bg-white">
      {/* Art hero — both commanders side by side */}
      <div className="relative flex h-[90px]">
        {/* Your deck art */}
        <div className="relative flex flex-1 items-end bg-[#0c2030]">
          {yourDeck.commander_scryfall_id && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${scryfallArtUrl(yourDeck.commander_scryfall_id)})`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,12,18,0.88)] via-[rgba(8,12,18,0.2)] to-transparent" />
          <div className="relative z-10 p-3">
            <p className="text-paper text-xs font-bold drop-shadow-md">
              {yourDeck.name}
            </p>
            <p className="text-teal-bright font-mono text-xs font-semibold">
              {formatPrice(yourDeck.estimated_value_cents, { decimals: false })}
            </p>
          </div>
        </div>

        {/* VS badge — match quality */}
        <div className="absolute top-3 left-1/2 z-20 -translate-x-1/2">
          <div
            className={`flex h-10 w-10 flex-col items-center justify-center rounded-full border-2 bg-white ${badgeTone}`}
          >
            <span className="font-mono text-[11px] leading-none font-bold">
              {match.match_score}%
            </span>
            <span className="text-slate text-[7px]">match</span>
          </div>
        </div>

        {/* Their deck art */}
        <div className="relative flex flex-1 items-end bg-[#0c2030]">
          {theirDeck.commander_scryfall_id && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${scryfallArtUrl(theirDeck.commander_scryfall_id)})`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,12,18,0.88)] via-[rgba(8,12,18,0.2)] to-transparent" />
          <div className="relative z-10 p-3 text-right">
            <p className="text-paper text-xs font-bold drop-shadow-md">
              {theirDeck.name}
            </p>
            <p className="text-teal-bright font-mono text-xs font-semibold">
              {formatPrice(theirDeck.estimated_value_cents, {
                decimals: false,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-3 py-2.5">
        <p className="text-ink-2 text-center text-[11px]">
          <span className="text-ink font-semibold">{owner.username}</span> in{' '}
          {owner.city}
          {match.value_diff_cents > 0 &&
            ` · ${formatPrice(match.value_diff_cents, { decimals: false })} cash balances this trade`}
        </p>
      </div>

      {/* Actions */}
      <div className="border-line flex border-t">
        <button
          onClick={(e) => {
            e.preventDefault()
            onDismiss(match.id)
          }}
          className="border-line text-slate hover:bg-paper-2 hover:text-ink flex-1 border-r py-2.5 text-[11px] font-semibold transition-colors"
        >
          Skip
        </button>
        <Link
          href={`/decks/${theirDeck.id}`}
          className="text-terra-deep hover:bg-paper-2 flex-1 py-2.5 text-center text-[11px] font-semibold transition-colors"
        >
          View &amp; trade →
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
    <section className="border-terra/25 from-terra/10 to-brass/[0.06] rounded-xl border bg-gradient-to-br p-[18px]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
        <h2 className="font-display text-ink text-base font-bold">
          Someone wants what you have
        </h2>
        <span className="text-terra-deep ml-auto font-mono text-[11px]">
          {matches.length} new match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onDismiss={handleDismiss} />
        ))}
      </div>
    </section>
  )
}
