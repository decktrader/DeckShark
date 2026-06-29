import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { getTrade } from '@/lib/services/trades.server'
import { getUserDecks } from '@/lib/services/decks.server'
import { getTradeReview } from '@/lib/services/reviews.server'
import { TradeActions } from '@/components/trades/trade-actions'
import { ReviewForm } from '@/components/reviews/review-form'
import { Pfp } from '@/components/ds/pfp'
import { formatPrice } from '@/lib/utils'

function scryfallArtUrl(id: string) {
  return `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg`
}

const STATUS_PILL: Record<string, string> = {
  proposed: 'bg-brass/20 text-brass-deep',
  accepted: 'bg-teal/15 text-teal-deep',
  countered: 'bg-slate/20 text-slate',
  completed: 'bg-teal text-paper',
  declined: 'bg-terra/15 text-terra-deep',
  cancelled: 'bg-paper-3 text-slate',
  disputed: 'bg-terra/15 text-terra-deep',
}

type OfferDeck = {
  id: string
  deck?: {
    name?: string | null
    commander_name?: string | null
    commander_scryfall_id?: string | null
    estimated_value_cents?: number | null
  } | null
}

function OfferSide({ label, decks }: { label: string; decks: OfferDeck[] }) {
  return (
    <div className="bg-white p-4">
      <div className="text-slate mb-3 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">
        {label}
      </div>
      {decks.length === 0 ? (
        <span className="border-teal/30 bg-teal/10 text-teal-deep inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold">
          Cash offer
        </span>
      ) : (
        decks.map((td) => (
          <div key={td.id} className="[&+&]:mt-3.5">
            <div
              className="rounded-card border-line aspect-[5/3] w-full border bg-[#0c2030] bg-cover bg-center"
              style={
                td.deck?.commander_scryfall_id
                  ? {
                      backgroundImage: `url(${scryfallArtUrl(td.deck.commander_scryfall_id)})`,
                    }
                  : undefined
              }
            />
            <div className="text-ink mt-2.5 text-sm font-bold">
              {td.deck?.name ?? 'Unknown deck'}
            </div>
            {td.deck?.commander_name && (
              <div className="text-slate mt-0.5 text-xs">
                {td.deck.commander_name}
              </div>
            )}
            <div className="text-teal-deep mt-1.5 font-mono text-[15px] font-semibold">
              {formatPrice(td.deck?.estimated_value_cents ?? null, {
                decimals: false,
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function StatusBanner({
  tone,
  children,
}: {
  tone: 'teal' | 'terra' | 'slate'
  children: React.ReactNode
}) {
  const cls =
    tone === 'teal'
      ? 'border-teal/30 bg-teal/10 text-teal-deep'
      : tone === 'terra'
        ? 'border-terra/30 bg-terra/[0.09] text-terra-deep'
        : 'border-line bg-paper-2 text-ink-2'
  return (
    <div
      className={`mt-4 rounded-lg border px-4 py-3 text-[13.5px] leading-relaxed ${cls}`}
    >
      {children}
    </div>
  )
}

function MessageRow({
  user,
  text,
}: {
  user: { username: string; avatar_url?: string | null }
  text: string
}) {
  return (
    <div className="border-line flex gap-3 rounded-lg border bg-white px-[15px] py-[13px]">
      <Pfp src={user.avatar_url} name={user.username} size={32} />
      <div>
        <div className="text-ink text-[12.5px] font-bold">{user.username}</div>
        <p className="text-ink-2 mt-0.5 text-[13.5px] leading-snug">{text}</p>
      </div>
    </div>
  )
}

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isValidUUID(id)) notFound()

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: trade } = await getTrade(id)

  if (!trade) notFound()

  // Only participants can view
  if (trade.proposer_id !== authUser.id && trade.receiver_id !== authUser.id) {
    notFound()
  }

  const isProposer = authUser.id === trade.proposer_id
  const themId = isProposer ? trade.receiver_id : trade.proposer_id
  const myProfile = isProposer ? trade.proposer : trade.receiver
  const theirProfile = isProposer ? trade.receiver : trade.proposer
  const email = authUser.email ?? ''

  const needsDecks = ['proposed', 'countered'].includes(trade.status)

  const [{ data: myReview }, myDecksResult, theirDecksResult] =
    await Promise.all([
      trade.status === 'completed'
        ? getTradeReview(id, authUser.id)
        : Promise.resolve({ data: null }),
      needsDecks ? getUserDecks(authUser.id) : Promise.resolve({ data: null }),
      needsDecks ? getUserDecks(themId) : Promise.resolve({ data: null }),
    ])

  const myAvailableDecks = (myDecksResult?.data ?? []).filter(
    (d) => d.available_for_trade,
  )
  const theirAvailableDecks = (theirDecksResult?.data ?? []).filter(
    (d) => d.available_for_trade,
  )

  const myDecks = trade.trade_decks.filter(
    (td) => td.offered_by === authUser.id,
  )
  const theirDecks = trade.trade_decks.filter(
    (td) => td.offered_by !== authUser.id,
  )

  // Cash-only trade = proposer offered no decks
  const proposerDecks = trade.trade_decks.filter(
    (td) => td.offered_by === trade.proposer_id,
  )
  const isCashOnly = proposerDecks.length === 0
  const them = isProposer ? trade.receiver : trade.proposer

  const cash = trade.cash_difference_cents ?? 0
  // cash > 0 means the proposer pays. Resolve to the viewer's perspective.
  const youReceiveCash = (cash > 0 && !isProposer) || (cash < 0 && isProposer)
  const cashSentence =
    cash !== 0
      ? youReceiveCash
        ? `they pay you ${formatPrice(Math.abs(cash), { decimals: false })} cash`
        : `you pay ${formatPrice(Math.abs(cash), { decimals: false })} cash`
      : null

  const opts = { decimals: false } as const
  const myValue = myDecks.reduce(
    (s, td) => s + (td.deck?.estimated_value_cents ?? 0),
    0,
  )
  const theirValue = theirDecks.reduce(
    (s, td) => s + (td.deck?.estimated_value_cents ?? 0),
    0,
  )
  const location = [them.city, them.province].filter(Boolean).join(', ')

  return (
    <main className="mx-auto max-w-[680px] px-[30px] pt-[22px] pb-28">
      <Link
        href="/trades"
        className="text-ink-2 hover:text-ink text-sm font-semibold"
      >
        ← All trades
      </Link>

      {/* Header */}
      <div className="mt-3.5 mb-[18px] flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-2.5">
          <Pfp src={them.avatar_url} name={them.username} size={44} />
          <div>
            <h1 className="font-display text-xl font-bold tracking-[-0.01em]">
              Trade with{' '}
              <Link
                href={`/profile/${them.username}`}
                className="text-terra-deep hover:underline"
              >
                {them.username}
              </Link>
            </h1>
            {location && (
              <div className="text-slate mt-0.5 text-xs">{location}</div>
            )}
          </div>
        </div>
        <span
          className={`rounded-pill shrink-0 px-3 py-[5px] font-mono text-[11px] font-semibold tracking-[0.06em] uppercase ${STATUS_PILL[trade.status] ?? 'bg-paper-3 text-slate'}`}
        >
          {trade.status}
        </span>
      </div>

      {/* Contextual status banner */}
      {trade.status === 'accepted' && (
        <StatusBanner tone="teal">
          You both accepted
          {them.city ? `. Meet up in ${them.city}` : ''}. Share contact info in
          the actions below to coordinate.
        </StatusBanner>
      )}
      {trade.status === 'completed' && (
        <StatusBanner tone="teal">
          This trade is complete{!myReview ? '. Leave a review below.' : '.'}
        </StatusBanner>
      )}
      {trade.status === 'declined' && (
        <StatusBanner tone="terra">This trade was declined.</StatusBanner>
      )}
      {trade.status === 'cancelled' && (
        <StatusBanner tone="slate">This trade was cancelled.</StatusBanner>
      )}

      {/* Comparison */}
      <div className="border-line bg-line mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
        <OfferSide label="You offer" decks={myDecks} />
        <OfferSide label="You receive" decks={theirDecks} />
      </div>

      {/* Totals */}
      <div className="border-line mt-3 flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3">
        <span className="text-ink-2 text-[13px]">
          You give{' '}
          <b className="text-ink font-mono">{formatPrice(myValue, opts)}</b>
        </span>
        <span className="text-ink-2 text-[13px]">
          You get{' '}
          <b className="text-ink font-mono">{formatPrice(theirValue, opts)}</b>
        </span>
      </div>

      {/* Cash balance */}
      {cashSentence && (
        <div className="border-brass/30 bg-brass/10 mt-3 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-[13.5px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-brass-deep h-4 w-4 shrink-0"
          >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>
            To even it out, <b className="font-semibold">{cashSentence}</b> at
            the meetup.
          </span>
        </div>
      )}

      {/* Message thread */}
      {(trade.message || trade.receiver_message) && (
        <div className="mt-[18px] flex flex-col gap-2.5">
          {trade.message && (
            <MessageRow user={trade.proposer} text={trade.message} />
          )}
          {trade.receiver_message && (
            <MessageRow user={trade.receiver} text={trade.receiver_message} />
          )}
        </div>
      )}

      {/* Review */}
      {trade.status === 'completed' && !myReview && (
        <div className="border-line mt-3.5 rounded-lg border bg-white p-4">
          <ReviewForm
            tradeId={trade.id}
            reviewerId={authUser.id}
            revieweeId={them.id}
            revieweeUsername={them.username}
          />
        </div>
      )}
      {trade.status === 'completed' && myReview && (
        <div className="border-line mt-3.5 rounded-lg border bg-white p-4">
          <p className="text-slate mb-1 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">
            Your review
          </p>
          <p className="text-brass text-lg tracking-[3px]">
            {'★'.repeat(myReview.rating)}
            {'☆'.repeat(5 - myReview.rating)}
          </p>
          {myReview.comment && (
            <p className="text-ink-2 mt-1 text-sm">{myReview.comment}</p>
          )}
        </div>
      )}

      {/* Actions */}
      {['proposed', 'countered', 'accepted'].includes(trade.status) && (
        <div className="border-line mt-5 rounded-xl border bg-white p-4">
          <TradeActions
            trade={trade}
            userId={authUser.id}
            myAvailableDecks={myAvailableDecks}
            theirAvailableDecks={theirAvailableDecks}
            currentMyDeckIds={myDecks.map((td) => td.deck_id)}
            currentTheirDeckIds={theirDecks.map((td) => td.deck_id)}
            isCashOnly={isCashOnly}
            myProfile={myProfile}
            theirProfile={theirProfile}
            email={email}
          />
        </div>
      )}
    </main>
  )
}
