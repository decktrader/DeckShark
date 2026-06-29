import Link from 'next/link'
import type { Metadata } from 'next'
import { getPublicDecks } from '@/lib/services/decks.server'
import { getInterestCountsForDecks } from '@/lib/services/deck-interests.server'
import { getHeroCities, getHeroStats } from '@/lib/services/hero.server'
import { NavyPanel, PanelHead } from '@/components/ds/navy-panel'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Market Pulse — DeckShark',
  description:
    'Observed signals from the Harbour: what players are wanting and where trading is happening, from real listings and activity.',
}

export default async function MarketPulsePage() {
  const [{ data: stats }, { data: cities }, { data: deckResult }] =
    await Promise.all([
      getHeroStats(),
      getHeroCities(),
      getPublicDecks({ pageSize: 40 }),
    ])

  const heroStats = stats ?? { totalDecks: 0, totalTraders: 0, totalCities: 0 }
  const decks = deckResult?.decks ?? []
  const { data: interest } = await getInterestCountsForDecks(
    decks.map((d) => d.id),
  )

  // Most wanted = decks ranked by observed interest (people who want it)
  const wanted = decks
    .map((d) => ({ deck: d, count: interest?.[d.id] ?? 0 }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  const maxWanted = Math.max(1, ...wanted.map((w) => w.count))

  // Local scene = cities ranked by active listings
  const localScene = (cities ?? [])
    .filter((c) => c.decks > 0)
    .sort((a, b) => b.decks - a.decks)
    .slice(0, 10)
  const maxCity = Math.max(1, ...localScene.map((c) => c.decks))

  return (
    <main className="mx-auto max-w-[1180px] px-[30px] pt-[26px] pb-[60px]">
      <div className="mb-6">
        <span className="text-terra-deep flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
          <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
          Observed signals
        </span>
        <h1 className="font-display mt-1.5 text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.02em]">
          Market Pulse
        </h1>
        <p className="text-ink-2 mt-1 text-sm">
          What players are reaching for and where trading is happening, from
          real listings and activity. A friendly guide, not an appraisal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Most wanted */}
        <NavyPanel>
          <PanelHead
            title="Most wanted"
            badge="signature"
            signal="by player interest"
          />
          {wanted.length === 0 ? (
            <p className="text-paper/50 px-4 py-8 text-center text-sm">
              No interest signals yet.
            </p>
          ) : (
            wanted.map((w) => (
              <Link
                key={w.deck.id}
                href={`/decks/${w.deck.id}`}
                className="border-line-navy hover:bg-paper/[0.04] grid grid-cols-[1fr_110px_44px] items-center gap-3 border-b px-4 py-[11px] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="font-display truncate text-sm font-bold">
                    {w.deck.name}
                  </div>
                  {w.deck.commander_name && (
                    <div className="text-paper/50 mt-0.5 truncate font-mono text-[9.5px]">
                      {w.deck.commander_name}
                    </div>
                  )}
                </div>
                <div className="bg-paper/10 h-[9px] overflow-hidden rounded-sm">
                  <div
                    className="bg-terra h-full rounded-sm"
                    style={{ width: `${(w.count / maxWanted) * 100}%` }}
                  />
                </div>
                <div className="text-right font-mono text-base font-semibold">
                  {w.count}
                </div>
              </Link>
            ))
          )}
        </NavyPanel>

        {/* Local scene */}
        <NavyPanel>
          <PanelHead
            title="Local scene"
            signal={`${heroStats.totalCities} cities`}
          />
          {localScene.length === 0 ? (
            <p className="text-paper/50 px-4 py-8 text-center text-sm">
              No active cities yet.
            </p>
          ) : (
            localScene.map((c) => (
              <Link
                key={c.name}
                href={`/decks?city=${encodeURIComponent(c.name)}`}
                className="border-line-navy hover:bg-paper/[0.04] grid grid-cols-[1fr_130px_70px] items-center gap-3 border-b px-4 py-[11px] last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="font-display truncate text-sm font-bold">
                    {c.name}
                  </div>
                  <div className="text-paper/50 mt-0.5 font-mono text-[9.5px]">
                    {c.traders} trader{c.traders !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="bg-paper/10 h-[9px] overflow-hidden rounded-sm">
                  <div
                    className="from-teal to-brass h-full rounded-sm bg-gradient-to-r"
                    style={{ width: `${(c.decks / maxCity) * 100}%` }}
                  />
                </div>
                <div className="text-paper/80 text-right font-mono text-[13px]">
                  {c.decks} deck{c.decks !== 1 ? 's' : ''}
                </div>
              </Link>
            ))
          )}
        </NavyPanel>
      </div>
    </main>
  )
}
