import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { getUserDecks } from '@/lib/services/decks.server'
import { getUserWantLists } from '@/lib/services/wantlists.server'
import { getUserTrades } from '@/lib/services/trades.server'
import { isOnboardingComplete } from '@/lib/services/users'
import { DeckCardNew } from '@/components/deck/deck-card-new'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ds/tag'
import { getUserInterestedDecks } from '@/lib/services/deck-interests.server'
import { getUserTradeMatches } from '@/lib/services/trade-matches.server'
import { PortfolioValue } from '@/components/dashboard/portfolio-value'
import { TradeMatches } from '@/components/dashboard/trade-matches'
import type { WantList } from '@/types'
import { formatPrice } from '@/lib/utils'

function scryfallArtUrl(id: string) {
  return `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg`
}

function priceRange(wl: WantList): string {
  const opts = { decimals: false } as const
  if (!wl.min_value_cents && !wl.max_value_cents) return ''
  if (!wl.min_value_cents)
    return `Up to ${formatPrice(wl.max_value_cents, opts)}`
  if (!wl.max_value_cents) return `${formatPrice(wl.min_value_cents, opts)}+`
  return `${formatPrice(wl.min_value_cents, opts)} – ${formatPrice(wl.max_value_cents, opts)}`
}

/** White section card with a header (title + sub + optional link) and body. */
function SectionCard({
  title,
  sub,
  link,
  children,
}: {
  title: string
  sub: string
  link?: { label: string; href: string }
  children: React.ReactNode
}) {
  return (
    <section className="border-line mb-[18px] overflow-hidden rounded-lg border bg-white">
      <div className="border-line flex items-center justify-between border-b px-[18px] py-[15px]">
        <div>
          <h2 className="font-display text-ink text-base font-bold">{title}</h2>
          <div className="text-slate mt-0.5 text-xs">{sub}</div>
        </div>
        {link && (
          <Link
            href={link.href}
            className="font-display text-terra-deep hover:text-terra text-[13px] font-bold"
          >
            {link.label}
          </Link>
        )}
      </div>
      <div className="p-[18px]">{children}</div>
    </section>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await getUserById(authUser.id)

  if (!profile || !isOnboardingComplete(profile)) {
    redirect('/onboarding')
  }

  const [
    { data: decks },
    { data: wantLists },
    { data: trades },
    { data: wantedDecks },
    { data: tradeMatches },
  ] = await Promise.all([
    getUserDecks(authUser.id),
    getUserWantLists(authUser.id),
    getUserTrades(authUser.id),
    getUserInterestedDecks(authUser.id),
    getUserTradeMatches(authUser.id),
  ])

  const deckList = decks ?? []
  const wlList = wantLists ?? []
  const activeTrades = (trades ?? []).filter((t) =>
    ['proposed', 'countered', 'accepted'].includes(t.status),
  ).length

  // Portfolio value calculations
  const totalValue = deckList.reduce(
    (sum, d) => sum + (d.estimated_value_cents ?? 0),
    0,
  )
  const totalChange = deckList.reduce((sum, d) => {
    const current = d.estimated_value_cents ?? 0
    const previous = d.previous_value_cents ?? current
    return sum + (current - previous)
  }, 0)
  const tradingCount = deckList.filter((d) => d.available_for_trade).length

  const tradingNow = deckList.filter((d) => d.available_for_trade).length
  const activeWl = wlList.filter((w) => w.status === 'active').length
  const fulfilledWl = wlList.filter((w) => w.status === 'fulfilled').length

  return (
    <main className="mx-auto max-w-[1080px] px-[30px] pt-[26px] pb-[60px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.02em]">
            Your dashboard
          </h1>
          <div className="text-ink-2 mt-1 text-[13.5px]">
            Welcome back, {profile.username}
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button asChild variant="terra" size="sm">
            <Link href="/decks/new">New deck</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/want-lists/new">New want list</Link>
          </Button>
        </div>
      </div>

      {/* Collection value */}
      <div className="mb-[22px]">
        <PortfolioValue
          totalValue={totalValue}
          totalChange={totalChange}
          deckCount={deckList.length}
          tradingCount={tradingCount}
          activeTrades={activeTrades}
          completedTrades={profile.completed_trades}
        />
      </div>

      {/* Trade matches */}
      {(tradeMatches ?? []).length > 0 && (
        <div className="mb-[22px]">
          <TradeMatches initialMatches={tradeMatches!} />
        </div>
      )}

      {/* Your decks */}
      <SectionCard
        title="Your decks"
        sub={`${tradingNow} of ${deckList.length} available for trade`}
        link={{ label: 'Browse', href: '/decks' }}
      >
        {deckList.length === 0 ? (
          <p className="text-ink-2 text-sm">
            No decks yet.{' '}
            <Link href="/decks/new" className="text-terra-deep font-semibold">
              Create one
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
            {deckList.map((d) => (
              <DeckCardNew key={d.id} deck={d} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Want lists */}
      <SectionCard
        title="Your want lists"
        sub={`${activeWl} active · ${fulfilledWl} fulfilled`}
        link={{ label: 'New want list', href: '/want-lists/new' }}
      >
        {wlList.length === 0 ? (
          <p className="text-ink-2 text-sm">
            No want lists yet.{' '}
            <Link
              href="/want-lists/new"
              className="text-terra-deep font-semibold"
            >
              Create one
            </Link>{' '}
            to let others know what you&apos;re looking for.
          </p>
        ) : (
          <div className="space-y-2">
            {wlList.map((wl) => (
              <Link
                key={wl.id}
                href={`/want-lists/${wl.id}`}
                className="border-line hover:border-line-2 flex items-center justify-between gap-3 rounded-md border px-3.5 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-bold">
                    {wl.title}
                  </p>
                  <div className="text-slate mt-1 flex items-center gap-2 text-[11.5px]">
                    {wl.format && (
                      <Tag variant="teal" className="capitalize">
                        {wl.format}
                      </Tag>
                    )}
                    {wl.commander_name && <span>{wl.commander_name}</span>}
                    {priceRange(wl) && <span>{priceRange(wl)}</span>}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-[10.5px] font-semibold tracking-[0.06em] uppercase ${wl.status === 'active' ? 'text-teal-deep' : 'text-slate'}`}
                >
                  {wl.status === 'active' ? 'Active' : 'Fulfilled'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Decks you want (shipping votes) */}
      {(wantedDecks ?? []).length > 0 && (
        <SectionCard
          title="Decks you want"
          sub={`${wantedDecks!.length} deck${wantedDecks!.length !== 1 ? 's' : ''} you've voted to ship`}
          link={{ label: 'Browse more', href: '/decks' }}
        >
          <div>
            {wantedDecks!.map((d) => (
              <Link
                key={d.deck_id}
                href={`/decks/${d.deck_id}`}
                className="border-line flex items-center gap-3.5 border-b py-2.5 last:border-b-0"
              >
                <div
                  className="rounded-card-sm border-line h-[46px] w-[46px] shrink-0 border bg-[#0c2030] bg-cover bg-center"
                  style={
                    d.commander_scryfall_id
                      ? {
                          backgroundImage: `url(${scryfallArtUrl(d.commander_scryfall_id)})`,
                        }
                      : undefined
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-[13.5px] font-bold">
                    {d.name}
                  </p>
                  <p className="text-slate truncate text-[11.5px]">
                    {d.commander_name}
                  </p>
                  <p className="text-ink-3 mt-0.5 text-[10.5px]">
                    {d.owner_username} · {d.owner_city}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-teal-deep font-mono text-[15px] font-semibold">
                    {formatPrice(d.estimated_value_cents, { decimals: false })}
                  </p>
                  <p className="text-slate text-[10.5px] capitalize">
                    {d.format}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      )}
    </main>
  )
}
