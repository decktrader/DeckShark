import Link from 'next/link'
import {
  getHeroCities,
  getHeroStats,
  getFeaturedDecks,
  getTickerItems,
} from '@/lib/services/hero.server'
import { HeroMap } from './hero-map'
import { HeroTicker } from './hero-ticker'
import { HeroFeatured } from './hero-featured'
import { HeroCTAs } from './hero-ctas'

export async function HeroSection() {
  const [
    { data: cities },
    { data: stats },
    { data: featured },
    { data: ticker },
  ] = await Promise.all([
    getHeroCities(),
    getHeroStats(),
    getFeaturedDecks(),
    getTickerItems(),
  ])

  const safeCities = cities ?? []
  const safeStats = stats ?? { totalDecks: 0, totalTraders: 0, totalCities: 0 }
  const safeFeatured = featured ?? []
  const safeTicker = ticker ?? []

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0b0418 0%, #1a0f2e 60%, #0f172a 100%)',
        }}
      />

      {/* Hex pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 4 L52 18 L52 46 L28 60 L4 46 L4 18 Z' fill='none' stroke='rgba(167,139,250,0.07)' stroke-width='1'/></svg>")`,
          backgroundSize: '56px 64px',
          maskImage:
            'radial-gradient(ellipse 90% 60% at 50% 40%, black, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 60% at 50% 40%, black, transparent 80%)',
        }}
      />

      {/* Glow blob */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-20%',
          left: '60%',
          width: 800,
          height: 800,
          background:
            'radial-gradient(circle, rgba(124,58,237,0.18), transparent 60%)',
        }}
      />

      {/* Two-column hero content */}
      <div className="relative mx-auto max-w-[80rem] px-4 pt-18 pb-10">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
          {/* LEFT — Copy */}
          <div>
            {/* Live badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-600/30 bg-violet-600/[0.12] px-3 py-1.5 text-xs text-violet-300">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                style={{ boxShadow: '0 0 8px #34d399' }}
              />
              Live in Canada &amp; the US &middot; {safeStats.totalCities}{' '}
              cities
            </div>

            {/* Headline */}
            <h1
              className="mb-5 font-extrabold"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
              }}
            >
              Trade decks.
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-pink-400 bg-clip-text text-transparent">
                Not cards.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mb-7 max-w-[460px] text-[17px] leading-relaxed text-white/70">
              List your built deck. Browse what other players across Canada and
              the US have already sleeved up. Skip the singles grind, get a new
              deck this weekend.
            </p>

            {/* Stat strip */}
            <div className="mb-8 flex gap-7 border-y border-white/[0.08] py-4">
              <div>
                <div className="text-[26px] leading-none font-extrabold text-white">
                  {safeStats.totalDecks}
                </div>
                <div className="mt-1 text-xs text-white/50">decks listed</div>
              </div>
              <div>
                <div className="text-[26px] leading-none font-extrabold text-white">
                  {safeStats.totalTraders}
                </div>
                <div className="mt-1 text-xs text-white/50">active traders</div>
              </div>
              <div>
                <div className="text-[26px] leading-none font-extrabold text-white">
                  {safeStats.totalCities}
                </div>
                <div className="mt-1 text-xs text-white/50">cities</div>
              </div>
            </div>

            {/* CTAs */}
            <HeroCTAs />

            {/* Founder candor strip */}
            <div className="mt-7 flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5 px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-400 text-[13px] font-bold text-white">
                DS
              </div>
              <div className="min-w-0 flex-1 text-[12.5px] leading-snug text-white/70">
                <strong className="text-white">
                  DeckShark is small, and that&apos;s the point.
                </strong>{' '}
                One developer, no fees for local trades. Your feedback shapes
                the platform.
              </div>
              <Link
                href="/about"
                className="shrink-0 rounded-md border border-violet-300/25 px-3 py-1.5 text-xs text-violet-300 transition-colors hover:border-violet-300/40 hover:text-violet-200"
              >
                Read the story
              </Link>
            </div>
          </div>

          {/* RIGHT — Interactive map (desktop) */}
          <div className="hidden lg:block">
            <HeroMap cities={safeCities} />
          </div>
        </div>
      </div>

      {/* Featured strip */}
      <HeroFeatured decks={safeFeatured} />

      {/* Live ticker */}
      <HeroTicker items={safeTicker} />
    </section>
  )
}
