'use client'

import Link from 'next/link'
import type {
  HeroUserData,
  HeroMatch,
  HeroInboxItem,
} from '@/lib/services/hero.server'
import { formatPrice } from '@/lib/utils'

// --- Shared sub-components ---

function PrimaryButton({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode
  href?: string
  onClick?: () => void
}) {
  const cls =
    'inline-flex items-center rounded-full px-[22px] py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]'
  const style = {
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
  }
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  )
}

function GhostButton({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode
  href?: string
  onClick?: () => void
}) {
  const cls =
    'inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-[22px] py-3 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/[0.08]'
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

function StatPill({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-[26px] leading-none font-extrabold text-white">
        {n}
      </div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
    </div>
  )
}

// --- State B: New User ---

function HeroNew({ data }: { data: HeroUserData }) {
  const steps = [
    { done: true, label: 'Account created' },
    {
      done: data.deckCount > 0,
      label: 'List your first deck',
      cta: 'Add deck',
      href: '/decks/new',
    },
    {
      done: data.wantListCount > 0,
      label: 'Add a want list',
      cta: 'Create want list',
      href: '/want-lists/new',
    },
    {
      done: data.hasCitySet,
      label: 'Set your home city',
      cta: 'Update profile',
      href: '/settings',
    },
  ]

  return (
    <>
      {/* Welcome badge (green) */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/[0.12] px-3 py-1.5 text-xs text-emerald-400">
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          style={{ boxShadow: '0 0 8px #34d399' }}
        />
        Welcome aboard, {data.username}
      </div>

      {/* Headline */}
      <h1
        className="mb-[18px] font-extrabold"
        style={{
          fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
        }}
      >
        Let&apos;s get
        <br />
        <span className="bg-gradient-to-r from-violet-300 to-pink-400 bg-clip-text text-transparent">
          your first trade.
        </span>
      </h1>

      {/* Subheadline */}
      <p className="mb-6 max-w-[480px] text-base leading-relaxed text-white/70">
        Two quick steps and you&apos;re on the map. List a deck or add to your
        want list — most users get a trade offer in 48 hours.
      </p>

      {/* Onboarding checklist */}
      <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3.5"
            style={{
              borderBottom:
                i < steps.length - 1
                  ? '1px solid rgba(255,255,255,0.05)'
                  : 'none',
            }}
          >
            <div
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
              style={{
                background: step.done ? '#34d399' : 'transparent',
                border: step.done
                  ? 'none'
                  : '1.5px solid rgba(255,255,255,0.25)',
                color: step.done ? '#0f172a' : 'rgba(255,255,255,0.5)',
              }}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <div
              className="flex-1 text-sm"
              style={{
                color: step.done ? 'rgba(255,255,255,0.5)' : 'white',
                textDecoration: step.done ? 'line-through' : 'none',
              }}
            >
              {step.label}
            </div>
            {step.cta && !step.done && (
              <Link
                href={step.href!}
                className="rounded-md border border-violet-500/30 bg-violet-500/[0.18] px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:border-violet-500/50"
              >
                {step.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <PrimaryButton href="/decks/new">+ List your first deck</PrimaryButton>
        <GhostButton
          onClick={() =>
            document
              .getElementById('browse')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          Browse what&apos;s near you
        </GhostButton>
      </div>
    </>
  )
}

// --- State C: Active User ---

function MatchCard({ match }: { match: HeroMatch }) {
  return (
    <Link
      href={`/decks/${match.deckId}`}
      className="flex items-center gap-3 rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]"
    >
      <div
        className="h-2 w-2 shrink-0 rounded-full bg-pink-400"
        style={{ boxShadow: '0 0 6px #f472b6' }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">
          {match.deckName}
        </div>
        <div className="truncate text-[11px] text-white/50">
          {match.matchReason} &middot; @{match.sellerUsername} &middot;{' '}
          {match.sellerCity}
        </div>
      </div>
      {match.priceCents != null && (
        <span className="shrink-0 text-sm font-bold text-emerald-400">
          {formatPrice(match.priceCents)}
        </span>
      )}
      <span className="shrink-0 text-lg text-white/30">&rsaquo;</span>
    </Link>
  )
}

function HeroActive({ data }: { data: HeroUserData }) {
  const matchCount = data.matches.length
  const cityShort = data.city?.split(',')[0] ?? 'you'

  return (
    <>
      {/* Welcome badge (violet) */}
      <div className="mb-[22px] inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/[0.12] px-3 py-1.5 text-xs text-violet-300">
        Welcome back, {data.username}
      </div>

      {/* Headline */}
      <h1
        className="mb-3.5 font-extrabold"
        style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {matchCount > 0 ? (
          <>
            <span className="bg-gradient-to-r from-violet-300 to-pink-400 bg-clip-text text-transparent">
              {matchCount} new match{matchCount !== 1 ? 'es' : ''}
            </span>{' '}
            on your want&nbsp;list.
          </>
        ) : (
          <>
            Your decks are{' '}
            <span className="bg-gradient-to-r from-violet-300 to-pink-400 bg-clip-text text-transparent">
              live and trading.
            </span>
          </>
        )}
      </h1>

      {/* Subheadline */}
      <p className="mb-[22px] max-w-[480px] text-[15px] leading-relaxed text-white/60">
        {matchCount > 0
          ? `Decks just listed in ${cityShort} that match what you're looking for.`
          : `Browse new decks near ${cityShort} or check your trade inbox.`}
      </p>

      {/* Match list */}
      {data.matches.length > 0 && (
        <div className="mb-[22px] flex flex-col gap-2">
          {data.matches.map((m) => (
            <MatchCard key={m.deckId} match={m} />
          ))}
        </div>
      )}

      {/* Personal stats */}
      <div className="mb-5 flex gap-7 border-y border-white/[0.08] py-3.5">
        <StatPill n={data.deckCount} label="your decks listed" />
        <StatPill n={data.wantListCount} label="want lists" />
        <StatPill n={data.unreadCount} label="unread messages" />
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        {matchCount > 0 ? (
          <PrimaryButton href="/want-lists">
            See all matches &rarr;
          </PrimaryButton>
        ) : (
          <PrimaryButton href="/dashboard">
            Go to dashboard &rarr;
          </PrimaryButton>
        )}
        <GhostButton
          onClick={() =>
            document
              .getElementById('browse')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          Browse near {cityShort}
        </GhostButton>
      </div>
    </>
  )
}

// --- State D: Power User ---

function InboxRow({ item, isLast }: { item: HeroInboxItem; isLast: boolean }) {
  const content = (
    <div
      className="flex items-center gap-3 px-3.5 py-3"
      style={{
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
        background: item.unread ? 'rgba(124,58,237,0.04)' : 'transparent',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{
          background: `linear-gradient(135deg, #8b5cf6, #f472b6)`,
        }}
      >
        {item.initial}
      </div>
      <div className="min-w-0 flex-1 truncate text-[13px] text-white/85">
        <strong className="text-white">@{item.who}</strong> {item.action}
      </div>
      <span className="shrink-0 text-[11px] text-white/40">{item.when}</span>
      {item.unread && (
        <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-pink-400" />
      )}
    </div>
  )

  if (item.link) {
    return (
      <Link
        href={item.link}
        className="block transition-colors hover:bg-white/[0.02]"
      >
        {content}
      </Link>
    )
  }
  return content
}

function HeroPower({ data }: { data: HeroUserData }) {
  return (
    <>
      {/* Badge */}
      <div className="mb-[22px] flex items-center gap-2">
        {data.isFoundingMember ? (
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{
              background:
                'linear-gradient(90deg, rgba(251,191,36,0.18), rgba(244,114,182,0.18))',
              borderColor: 'rgba(251,191,36,0.4)',
              color: '#fbbf24',
            }}
          >
            ★ Founding Member &middot; {data.completedTrades} trades
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/[0.12] px-3 py-1.5 text-xs text-violet-300">
            Welcome back, {data.username} &middot; {data.completedTrades} trades
          </div>
        )}
      </div>

      {/* Headline */}
      <h1
        className="mb-[18px] font-extrabold"
        style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        Pick up where
        <br />
        you left off.
      </h1>

      {/* Inbox feed */}
      {data.inboxItems.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-[10px] border border-white/[0.08] bg-white/[0.02]">
          {data.inboxItems.map((item, i) => (
            <InboxRow
              key={item.id}
              item={item}
              isLast={i === data.inboxItems.length - 1}
            />
          ))}
        </div>
      )}

      {data.inboxItems.length === 0 && (
        <p className="mb-5 text-sm text-white/50">
          No recent activity. Browse for new decks or check your want lists.
        </p>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <PrimaryButton href="/notifications">Open inbox &rarr;</PrimaryButton>
        <GhostButton href="/dashboard">
          Manage your decks ({data.deckCount})
        </GhostButton>
      </div>
    </>
  )
}

// --- Main signed-in hero dispatcher ---

export function HeroSignedIn({ data }: { data: HeroUserData }) {
  switch (data.state) {
    case 'signed-in-new':
      return <HeroNew data={data} />
    case 'signed-in-active':
      return <HeroActive data={data} />
    case 'signed-in-power':
      return <HeroPower data={data} />
    default:
      return null
  }
}
