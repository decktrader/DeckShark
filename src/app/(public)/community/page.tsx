import Link from 'next/link'
import type { Metadata } from 'next'
import { getHeroStats, getHeroCities } from '@/lib/services/hero.server'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community — DeckShark',
  description:
    'The DeckShark community: where players are trading complete decks in person, across Canada and the US.',
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-line-navy border-r px-5 py-4 last:border-r-0">
      <div className="font-display text-[26px] leading-none font-bold">
        {value}
      </div>
      <div className="text-paper/60 mt-1.5 text-[11.5px]">{label}</div>
    </div>
  )
}

export default async function CommunityPage() {
  const [{ data: stats }, { data: cities }] = await Promise.all([
    getHeroStats(),
    getHeroCities(),
  ])

  const heroStats = stats ?? { totalDecks: 0, totalTraders: 0, totalCities: 0 }
  const activeCities = (cities ?? [])
    .filter((c) => c.decks > 0)
    .sort((a, b) => b.traders - a.traders)

  return (
    <main className="mx-auto max-w-[1180px] px-[30px] pt-[26px] pb-[60px]">
      <div className="mb-5">
        <span className="text-terra-deep flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
          <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
          Made by players, in person
        </span>
        <h1 className="font-display mt-1.5 text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.02em]">
          The community
        </h1>
        <p className="text-ink-2 mt-1 text-sm">
          Real players trading complete decks across Canada and the US. Find
          your city and see who you can trade with.
        </p>
      </div>

      {/* Community stats */}
      <div className="bg-navy text-paper shadow-panel grid grid-cols-3 overflow-hidden rounded-xl">
        <Stat
          value={heroStats.totalTraders.toLocaleString('en-US')}
          label="Active traders"
        />
        <Stat
          value={heroStats.totalDecks.toLocaleString('en-US')}
          label="Decks listed for trade"
        />
        <Stat value={String(heroStats.totalCities)} label="Cities trading" />
      </div>

      {/* Active cities */}
      <div className="mt-8 mb-4 flex items-baseline gap-2.5">
        <h2 className="font-display text-[19px] font-bold tracking-[-0.01em]">
          Where players are trading
        </h2>
        {activeCities.length > 0 && (
          <span className="text-slate font-mono text-xs">
            {activeCities.length} cities
          </span>
        )}
      </div>

      {activeCities.length === 0 ? (
        <p className="text-ink-2 text-sm">
          No active cities yet. Be the first.{' '}
          <Link href="/decks/new" className="text-terra-deep font-semibold">
            List a deck
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeCities.map((c) => (
            <Link
              key={c.name}
              href={`/decks?city=${encodeURIComponent(c.name)}`}
              className="border-line hover:shadow-card rounded-lg border bg-white px-[15px] py-[13px] transition-[transform,box-shadow] hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-[15.5px] font-bold">
                  {c.name}
                </span>
                <span className="text-teal-deep font-mono text-[11px] font-semibold">
                  {c.country}
                </span>
              </div>
              <div className="text-slate mt-2 font-mono text-[11.5px]">
                {c.traders} trader{c.traders !== 1 ? 's' : ''} · {c.decks} deck
                {c.decks !== 1 ? 's' : ''} listed
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
