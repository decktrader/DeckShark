'use client'

import Link from 'next/link'
import type { FeaturedDeck } from '@/lib/services/hero.server'

function scryfallArtUrl(scryfallId: string): string {
  return `https://cards.scryfall.io/art_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
}

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '\u2014'
  return `$${Math.round(cents / 100).toLocaleString()}`
}

interface HeroFeaturedProps {
  decks: FeaturedDeck[]
}

export function HeroFeatured({ decks }: HeroFeaturedProps) {
  if (decks.length === 0) return null

  return (
    <div className="relative z-[1] mx-auto max-w-[80rem] px-4 pb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-[11px] font-semibold tracking-[0.1em] text-violet-300/70 uppercase">
          Trending today
        </div>
        <Link
          href="#browse"
          className="text-xs text-white/50 transition-colors hover:text-white/70"
          onClick={(e) => {
            e.preventDefault()
            document
              .getElementById('browse')
              ?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          See all &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {decks.map((d) =>
          d.commander_scryfall_id ? (
            <Link
              key={d.id}
              href={`/decks/${d.id}`}
              className="group relative overflow-hidden rounded-[10px] border border-white/[0.08] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300/40"
              style={{ aspectRatio: '16 / 9' }}
            >
              {/* Background art */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${scryfallArtUrl(d.commander_scryfall_id)})`,
                }}
              />
              {/* Gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              {/* Text */}
              <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2">
                <div className="truncate text-[13px] font-bold text-white">
                  {d.name}
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span className="truncate">
                    {d.ownerCity}
                    {d.ownerProvince ? `, ${d.ownerProvince}` : ''}
                  </span>
                  <span className="shrink-0 font-bold text-emerald-400">
                    {formatPrice(d.estimated_value_cents)}
                  </span>
                </div>
              </div>
            </Link>
          ) : null,
        )}
      </div>
    </div>
  )
}
