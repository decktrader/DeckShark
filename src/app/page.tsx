import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPublicDecks } from '@/lib/services/decks.server'
import { getInterestCountsForDecks } from '@/lib/services/deck-interests.server'
import {
  getHeroStats,
  getTickerItems,
  getFeaturedDecks,
  getHeroCities,
  getHeroUserData,
} from '@/lib/services/hero.server'
import type { HeroUserData } from '@/lib/services/hero.server'
import { Button } from '@/components/ui/button'
import { DeckCard } from '@/components/ds/deck-card'
import { Pfp } from '@/components/ds/pfp'
import { LiveTicker } from '@/components/home/live-ticker'
import { HomeHero } from '@/components/home/home-hero'

export const metadata: Metadata = {
  title: 'DeckShark — Trade MTG Decks Near You',
  description:
    'Find local Magic: The Gathering players and trade complete decks in person. Browse trade-available decks across Canada and the US.',
  openGraph: {
    title: 'DeckShark — Trade MTG Decks Near You',
    description:
      'Find local Magic: The Gathering players and trade complete decks in person.',
    type: 'website',
  },
}

function usd(cents: number | null): string {
  if (cents == null) return ''
  return '$' + Math.round(cents / 100).toLocaleString('en-US')
}

function SectionHead({
  eyebrow,
  title,
  sub,
  link,
}: {
  eyebrow: string
  title: string
  sub: string
  link?: { label: string; href: string }
}) {
  return (
    <div className="mb-[22px] flex items-end justify-between gap-5">
      <div>
        <span className="text-brass-deep font-mono text-[11px] font-semibold tracking-[0.2em] uppercase">
          {eyebrow}
        </span>
        <h2 className="font-display text-[clamp(26px,3vw,38px)] leading-[1.04] font-bold tracking-[-0.02em]">
          {title}
        </h2>
        <div className="text-ink-2 mt-1.5 text-[15px]">{sub}</div>
      </div>
      {link && (
        <Link
          href={link.href}
          className="font-display text-terra hover:text-terra-deep shrink-0 text-[13px] font-bold whitespace-nowrap"
        >
          {link.label} →
        </Link>
      )}
    </div>
  )
}

export default async function HomePage() {
  let heroUserData: HeroUserData | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      const { data } = await getHeroUserData(authUser.id)
      heroUserData = data
    }
  } catch {
    /* non-critical */
  }

  const [
    { data: stats },
    { data: tickerItems },
    { data: featured },
    { data: cities },
    { data: movingResult },
  ] = await Promise.all([
    getHeroStats(),
    getTickerItems(),
    getFeaturedDecks(),
    getHeroCities(),
    getPublicDecks({ pageSize: 4 }),
  ])

  const ticker = tickerItems ?? []
  const heroStats = stats ?? { totalDecks: 0, totalTraders: 0, totalCities: 0 }
  const movingDecks = movingResult?.decks ?? []
  const { data: movingInterest } = await getInterestCountsForDecks(
    movingDecks.map((d) => d.id),
  )

  const tradedItems = ticker.filter((t) => t.action === 'traded').slice(0, 4)
  const hotspots = (cities ?? []).filter((c) => c.decks > 0).slice(0, 5)
  const maxHotspot = Math.max(1, ...hotspots.map((h) => h.decks))
  const featuredDecks = (featured ?? []).slice(0, 3)
  const isLoggedIn = !!heroUserData

  return (
    <main>
      <LiveTicker
        items={ticker}
        liveCount={heroStats.totalTraders}
        cityCount={heroStats.totalCities}
      />

      <HomeHero userData={heroUserData} stats={heroStats} feedItems={ticker} />

      {/* Community pulse — real totals, links to Market Pulse */}
      <section className="bg-navy-2 text-paper">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-12 gap-y-6 px-[30px] py-[30px]">
          <div className="border-line-navy pr-6 lg:border-r">
            <div className="text-terra-bright flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
              <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
              In the Harbour
            </div>
            <div className="font-display mt-1.5 text-[21px] leading-tight font-bold">
              The Community Pulse
            </div>
            <Link
              href="/pulse"
              className="font-display text-brass-bright hover:text-brass mt-2 inline-block text-[13px] font-bold"
            >
              See Market Pulse →
            </Link>
          </div>
          <PulseStat
            n={heroStats.totalDecks.toLocaleString('en-US')}
            label="Decks listed for trade"
          />
          <PulseStat
            n={heroStats.totalTraders.toLocaleString('en-US')}
            label="Active traders"
          />
          <PulseStat n={String(heroStats.totalCities)} label="Cities trading" />
        </div>
      </section>

      {/* What's Moving */}
      {movingDecks.length > 0 && (
        <section className="py-[46px]">
          <div className="mx-auto max-w-[1280px] px-[30px]">
            <SectionHead
              eyebrow="Decks gaining momentum"
              title="What's Moving"
              sub="The decks the community is reaching for this week."
              link={{ label: 'Browse all decks', href: '/decks' }}
            />
            <div className="grid grid-cols-2 gap-[18px] md:grid-cols-3 lg:grid-cols-4">
              {movingDecks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  interestCount={movingInterest?.[deck.id] ?? 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Just Traded + Local Hotspots */}
      <section className="pb-[46px]">
        <div className="mx-auto grid max-w-[1280px] gap-[26px] px-[30px] lg:grid-cols-[1.25fr_1fr]">
          {/* Just Traded */}
          <div className="border-line overflow-hidden rounded-[14px] border bg-white">
            <div className="border-line flex items-center gap-2.5 border-b px-[18px] py-[15px]">
              <span className="text-terra flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
                <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
                Fresh
              </span>
              <span className="font-display text-base font-bold">
                Just Traded
              </span>
            </div>
            {tradedItems.length > 0 ? (
              tradedItems.map((t, i) => (
                <div
                  key={i}
                  className="border-line flex items-center gap-3 border-b px-[18px] py-3.5 last:border-b-0"
                >
                  <span className="flex shrink-0 items-center">
                    <Pfp
                      name={t.who}
                      size={34}
                      className="border-2 border-white"
                    />
                    <Pfp
                      name={t.what}
                      size={34}
                      className="-ml-2.5 border-2 border-white"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-ink text-[13.5px] leading-snug">
                      <b className="font-bold">{t.who}</b> traded{' '}
                      <b className="font-bold">{t.what}</b>
                    </div>
                    <div className="text-slate mt-0.5 text-[11.5px]">
                      {t.city}
                    </div>
                  </div>
                  <span className="text-slate shrink-0 font-mono text-[10.5px] whitespace-nowrap">
                    {t.when}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate px-[18px] py-8 text-center text-sm">
                No completed trades yet. Be the first to make a swap.
              </p>
            )}
          </div>

          {/* Local Hotspots */}
          <div className="border-line overflow-hidden rounded-[14px] border bg-white">
            <div className="border-line flex items-center gap-2.5 border-b px-[18px] py-[15px]">
              <span className="font-display text-base font-bold">
                Local Trade Hotspots
              </span>
              <span className="text-slate ml-auto font-mono text-[11px]">
                where it&apos;s happening
              </span>
            </div>
            {hotspots.length > 0 ? (
              hotspots.map((c) => (
                <div
                  key={c.name}
                  className="border-line border-b px-[18px] py-[13px] last:border-b-0"
                >
                  <div className="flex items-baseline justify-between gap-2.5">
                    <span className="font-display text-[15.5px] font-bold">
                      {c.name}
                    </span>
                    <span className="text-terra-deep font-mono text-[11px] font-semibold">
                      {c.decks} deck{c.decks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="bg-paper-3 mt-2 h-1.5 overflow-hidden rounded">
                    <div
                      className="from-teal to-brass h-full rounded bg-gradient-to-r"
                      style={{ width: `${(c.decks / maxHotspot) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate px-[18px] py-8 text-center text-sm">
                No active cities yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featuredDecks.length > 0 && (
        <section className="pb-[46px]">
          <div className="mx-auto max-w-[1280px] px-[30px]">
            <SectionHead
              eyebrow="Picked by the Harbour"
              title="Featured Decks"
              sub="Standout builds players are excited about right now."
              link={{ label: 'All decks', href: '/decks' }}
            />
            <div className="grid gap-5 md:grid-cols-3">
              {featuredDecks.map((d) => (
                <Link
                  key={d.id}
                  href={`/decks/${d.id}`}
                  className="group border-line bg-navy-3 shadow-card relative block aspect-[3/2] overflow-hidden rounded-[14px] border"
                >
                  {d.commander_scryfall_id && (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundImage: `url(https://cards.scryfall.io/art_crop/front/${d.commander_scryfall_id[0]}/${d.commander_scryfall_id[1]}/${d.commander_scryfall_id}.jpg)`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[30%] to-[rgba(24,34,45,0.92)]" />
                  <span className="bg-brass absolute top-3 left-3 z-[2] rounded-md px-2.5 py-1 font-mono text-[9.5px] font-semibold tracking-[0.1em] text-[#2A1F12] uppercase">
                    Featured
                  </span>
                  <div className="text-paper absolute inset-x-3.5 bottom-3.5 z-[2]">
                    <div className="font-display text-xl leading-tight font-bold">
                      {d.name}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-paper/80 text-xs">
                        {[d.commander_name, d.ownerCity]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      {d.estimated_value_cents != null && (
                        <span className="text-teal-bright font-mono text-xs font-semibold">
                          {usd(d.estimated_value_cents)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promise CTA */}
      <section className="bg-terra text-paper relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 80% at 85% 50%, rgba(0,0,0,0.12), transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-[30px] py-[46px] text-center">
          <span className="text-paper/85 font-mono text-[11px] font-semibold tracking-[0.2em] uppercase">
            The DeckShark promise
          </span>
          <h2 className="font-display mx-auto mt-3.5 max-w-[820px] text-[clamp(25px,3.1vw,38px)] leading-[1.08] font-bold tracking-[-0.02em]">
            There&apos;s always somebody looking for exactly the deck
            you&apos;re trying to move.
          </h2>
          <p className="text-paper/[0.88] mt-2.5 text-[15.5px]">
            Stop grinding singles. List what you built, find what you want, and
            trade into a deck you&apos;re excited to play.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild variant="navy">
              <Link href="/decks">Browse decks →</Link>
            </Button>
            <Button asChild variant="brass">
              <Link href={isLoggedIn ? '/decks/new' : '/register'}>
                {isLoggedIn && (heroUserData?.deckCount ?? 0) > 0
                  ? 'List a deck'
                  : 'List your first deck'}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

function PulseStat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display text-[28px] leading-none font-bold">{n}</div>
      <div className="text-paper/[0.62] mt-1.5 max-w-[120px] text-[11.5px] font-medium">
        {label}
      </div>
    </div>
  )
}
