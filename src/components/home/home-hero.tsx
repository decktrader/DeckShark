import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pfp } from '@/components/ds/pfp'
import type {
  HeroUserData,
  HeroStats,
  TickerItem,
} from '@/lib/services/hero.server'

function usd(cents: number | null): string {
  if (cents == null) return ''
  return '$' + Math.round(cents / 100).toLocaleString('en-US')
}

/** Secondary CTA styled for the navy hero (light ghost border). */
function GhostLight({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="border-line-navy font-display text-paper hover:border-paper inline-flex items-center gap-2 rounded-md border-[1.5px] px-5 py-[11px] text-[15px] font-bold transition-colors"
    >
      {children}
    </Link>
  )
}

function Stat({
  n,
  label,
  tone,
}: {
  n: string
  label: string
  tone?: boolean
}) {
  return (
    <div>
      <div
        className={`font-display text-[30px] leading-none font-bold ${tone ? 'text-terra-bright' : ''}`}
      >
        {n}
      </div>
      <div className="text-paper/60 mt-1.5 text-xs font-medium">{label}</div>
    </div>
  )
}

function FeedColumn({ items }: { items: TickerItem[] }) {
  const phrase = (it: TickerItem) => {
    if (it.action === 'listed')
      return (
        <>
          <b className="font-bold">{it.who}</b> just listed{' '}
          <b className="font-bold">{it.what}</b>
        </>
      )
    if (it.action === 'wants')
      return (
        <>
          <b className="font-bold">{it.who}</b> is looking for{' '}
          <b className="font-bold">{it.what}</b>
        </>
      )
    return (
      <>
        <b className="font-bold">{it.who}</b> traded{' '}
        <b className="font-bold">{it.what}</b>
      </>
    )
  }
  const verbClass: Record<TickerItem['action'], string> = {
    wants: 'bg-terra/15 text-terra-deep',
    listed: 'bg-teal/15 text-teal-deep',
    traded: 'bg-brass/20 text-brass-deep',
  }

  return (
    <div className="bg-paper text-ink shadow-panel overflow-hidden rounded-[14px]">
      <div className="border-line bg-paper-2 flex items-center gap-2.5 border-b px-[18px] py-[15px]">
        <span className="text-terra flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
          <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
          Live
        </span>
        <span className="font-display text-[15px] font-bold">
          In the Harbour right now
        </span>
      </div>
      <div className="max-h-[556px] overflow-hidden">
        {items.slice(0, 9).map((it, i) => (
          <div
            key={i}
            className="border-line flex items-center gap-3 border-b px-[18px] py-[13px] last:border-b-0"
          >
            <Pfp name={it.who} size={38} />
            <div className="min-w-0 flex-1">
              <div className="text-ink text-sm leading-snug">{phrase(it)}</div>
              <div className="text-slate mt-0.5 text-[11.5px]">
                {it.city} · {it.when}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-sm px-[7px] py-[3px] font-mono text-[9.5px] font-semibold tracking-[0.08em] uppercase ${verbClass[it.action]}`}
            >
              {it.action}
            </span>
          </div>
        ))}
      </div>
      <div className="border-line border-t px-[18px] py-3 text-center">
        <Link
          href="/decks"
          className="font-display text-terra hover:text-terra-deep text-[13px] font-bold"
        >
          See all activity →
        </Link>
      </div>
    </div>
  )
}

export function HomeHero({
  userData,
  stats,
  feedItems,
}: {
  userData: HeroUserData | null
  stats: HeroStats
  feedItems: TickerItem[]
}) {
  const state = userData?.state ?? 'logged-out'

  return (
    <section className="bg-navy text-paper relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 88% 0%, rgba(193,148,88,0.16), transparent 60%), radial-gradient(ellipse 45% 55% at 0% 100%, rgba(61,122,117,0.18), transparent 60%)',
        }}
      />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-11 px-[30px] py-10 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          {state === 'logged-out' && (
            <>
              <span className="text-terra-bright mb-[18px] inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
                <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
                The Harbour is open
              </span>
              <h1 className="font-display text-[clamp(38px,5vw,62px)] leading-none font-bold tracking-[-0.02em]">
                Trade decks.
                <br />
                <span className="text-brass">Not cards.</span>
              </h1>
              <p className="text-paper/[0.78] mt-5 max-w-[480px] text-[18px] leading-relaxed">
                List your built deck. Browse what other players across Canada
                and the US have already sleeved up. Skip the singles grind, get
                a new deck this weekend.
              </p>
              <div className="border-line-navy mt-6 flex gap-7 border-t pt-[18px]">
                <Stat
                  n={stats.totalDecks.toLocaleString('en-US')}
                  label="decks listed"
                  tone
                />
                <Stat
                  n={stats.totalTraders.toLocaleString('en-US')}
                  label="active traders"
                />
                <Stat n={String(stats.totalCities)} label="cities" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="terra">
                  <Link href="/register">Create a free account →</Link>
                </Button>
                <GhostLight href="/decks">Browse decks</GhostLight>
              </div>
            </>
          )}

          {state === 'signed-in-new' && userData && (
            <>
              <span className="rounded-pill border-teal/30 bg-teal/15 text-teal-bright mb-[18px] inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-semibold">
                <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
                Welcome aboard, {userData.username}
              </span>
              <h1 className="font-display text-[clamp(38px,5vw,62px)] leading-none font-bold tracking-[-0.02em]">
                Let&apos;s get
                <br />
                <span className="text-brass">your first trade.</span>
              </h1>
              <p className="text-paper/[0.78] mt-5 max-w-[480px] text-[18px] leading-relaxed">
                Two quick steps and you&apos;re on the map. List a deck or add a
                want list, most players get a trade offer within 48 hours.
              </p>
              <div className="border-line-navy my-[22px] max-w-[480px] overflow-hidden rounded-lg border">
                <ChecklistItem done label="Account created" />
                <ChecklistItem
                  done={userData.deckCount > 0}
                  n={2}
                  label="List your first deck"
                  cta={{ label: 'Add deck', href: '/decks/new' }}
                />
                <ChecklistItem
                  done={userData.wantListCount > 0}
                  n={3}
                  label="Add a want list"
                  cta={{ label: 'Create want list', href: '/want-lists/new' }}
                />
                <ChecklistItem
                  done={userData.hasCitySet}
                  label="Set your home city"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="terra">
                  <Link href="/decks/new">List your first deck →</Link>
                </Button>
                <GhostLight href="/decks">Browse near you</GhostLight>
              </div>
            </>
          )}

          {state === 'signed-in-active' && userData && (
            <>
              <span className="rounded-pill border-brass/30 bg-brass/15 text-brass-bright mb-[18px] inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-semibold">
                Welcome back, {userData.username}
              </span>
              <h1 className="font-display text-[clamp(38px,5vw,62px)] leading-none font-bold tracking-[-0.02em]">
                {userData.matches.length > 0 ? (
                  <>
                    <span className="text-brass">
                      {userData.matches.length} new match
                      {userData.matches.length !== 1 ? 'es' : ''}
                    </span>{' '}
                    on your want list.
                  </>
                ) : (
                  <>
                    Welcome back to
                    <br />
                    <span className="text-brass">the Harbour.</span>
                  </>
                )}
              </h1>
              {userData.matches.length > 0 && (
                <>
                  <p className="text-paper/[0.78] mt-5 max-w-[480px] text-[18px] leading-relaxed">
                    Decks just listed
                    {userData.city ? ` in ${userData.city}` : ''} that match
                    what you&apos;re looking for.
                  </p>
                  <div className="my-[22px] flex max-w-[480px] flex-col gap-2">
                    {userData.matches.map((m) => (
                      <Link
                        key={m.deckId}
                        href={`/decks/${m.deckId}`}
                        className="border-line-navy bg-paper/[0.04] flex items-center gap-3 rounded-[10px] border px-[13px] py-2.5"
                      >
                        <span className="bg-terra-bright h-2 w-2 shrink-0 rounded-full" />
                        <span className="min-w-0 flex-1">
                          <span className="text-paper block text-[13.5px] font-semibold">
                            {m.deckName}
                          </span>
                          <span className="text-paper/50 mt-0.5 block truncate text-[11px]">
                            {m.matchReason} · {m.sellerUsername} ·{' '}
                            {m.sellerCity}
                          </span>
                        </span>
                        {m.priceCents != null && (
                          <span className="text-teal-bright shrink-0 font-mono text-[13px] font-semibold">
                            {usd(m.priceCents)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </>
              )}
              <div className="border-line-navy mb-5 flex gap-7 border-t pt-[18px]">
                <Stat
                  n={String(userData.deckCount)}
                  label="your decks listed"
                />
                <Stat n={String(userData.wantListCount)} label="want lists" />
                <Stat
                  n={String(userData.unreadCount)}
                  label="unread messages"
                  tone
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="terra">
                  <Link href="/dashboard">See all matches →</Link>
                </Button>
                <GhostLight
                  href={
                    userData.city
                      ? `/decks?city=${encodeURIComponent(userData.city)}`
                      : '/decks'
                  }
                >
                  {userData.city
                    ? `Browse near ${userData.city}`
                    : 'Browse decks'}
                </GhostLight>
              </div>
            </>
          )}

          {state === 'signed-in-power' && userData && (
            <>
              <span className="rounded-pill border-brass/40 from-brass/20 to-terra/15 text-brass-bright mb-[18px] inline-flex items-center gap-2 border bg-gradient-to-r px-3 py-1.5 text-xs font-semibold">
                {userData.isFoundingMember
                  ? `Founding Member · ${userData.completedTrades} trades`
                  : `${userData.completedTrades} trades`}
              </span>
              <h1 className="font-display text-[clamp(38px,5vw,62px)] leading-none font-bold tracking-[-0.02em]">
                Pick up where
                <br />
                <span className="text-brass">you left off.</span>
              </h1>
              {userData.inboxItems.length > 0 && (
                <div className="border-line-navy my-5 max-w-[480px] overflow-hidden rounded-[10px] border">
                  {userData.inboxItems.map((it) => (
                    <Link
                      key={it.id}
                      href={it.link ?? '/notifications'}
                      className={`border-line-navy flex items-center gap-3 border-b px-[13px] py-[11px] last:border-b-0 ${it.unread ? 'bg-terra/[0.06]' : ''}`}
                    >
                      <Pfp name={it.who} size={32} />
                      <span className="text-paper/85 min-w-0 flex-1 text-[13px]">
                        {it.action}
                      </span>
                      <span className="text-paper/40 shrink-0 font-mono text-[11px]">
                        {it.when}
                      </span>
                      {it.unread && (
                        <span className="bg-terra-bright h-[7px] w-[7px] shrink-0 rounded-full" />
                      )}
                    </Link>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="terra">
                  <Link href="/trades">Open inbox →</Link>
                </Button>
                <GhostLight href="/dashboard">
                  {`Manage your decks (${userData.deckCount})`}
                </GhostLight>
              </div>
            </>
          )}
        </div>

        {/* Live feed */}
        <FeedColumn items={feedItems} />
      </div>
    </section>
  )
}

function ChecklistItem({
  done,
  n,
  label,
  cta,
}: {
  done?: boolean
  n?: number
  label: string
  cta?: { label: string; href: string }
}) {
  return (
    <div className="border-line-navy flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0">
      <span
        className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[11px] font-bold ${
          done
            ? 'bg-teal text-navy'
            : 'border-paper/25 text-paper/50 border-[1.5px]'
        }`}
      >
        {done ? <Check className="h-3 w-3" /> : n}
      </span>
      <span
        className={`flex-1 text-[13.5px] ${done ? 'text-paper/50 line-through' : ''}`}
      >
        {label}
      </span>
      {!done && cta && (
        <Link
          href={cta.href}
          className="border-brass/30 text-brass-bright rounded-md border px-2.5 py-1 text-[11.5px] font-semibold"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
