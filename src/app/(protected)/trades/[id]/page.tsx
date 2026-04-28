import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { getTrade } from '@/lib/services/trades.server'
import { getUserDecks } from '@/lib/services/decks.server'
import { getTradeReview } from '@/lib/services/reviews.server'
import { TradeActions } from '@/components/trades/trade-actions'
import { ReviewForm } from '@/components/reviews/review-form'
import { Card, CardContent } from '@/components/ui/card'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

function scryfallArtUrl(id: string) {
  return `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg`
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  proposed: { label: 'Proposed', color: 'text-yellow-400' },
  accepted: { label: 'Accepted', color: 'text-green-400' },
  declined: { label: 'Declined', color: 'text-red-400' },
  countered: { label: 'Countered', color: 'text-blue-400' },
  completed: { label: 'Completed', color: 'text-green-500' },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground' },
  disputed: { label: 'Disputed', color: 'text-red-500' },
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
  const status = STATUS_LABELS[trade.status] ?? {
    label: trade.status,
    color: '',
  }

  const cashLabel =
    trade.cash_difference_cents !== 0
      ? trade.cash_difference_cents > 0
        ? `${isProposer ? 'You pay' : 'They pay'} ${formatPrice(trade.cash_difference_cents)}`
        : `${isProposer ? 'They pay' : 'You pay'} ${formatPrice(Math.abs(trade.cash_difference_cents))}`
      : null

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 pb-28">
      <Link
        href="/trades"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        All trades
      </Link>

      {/* Compact header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
            {them.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold">
              Trade with{' '}
              <Link
                href={`/profile/${them.username}`}
                className="hover:underline"
              >
                {them.username}
              </Link>
            </h1>
            <p className="text-muted-foreground text-xs">
              {them.city && `${them.city}, ${them.province}`}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full bg-white/5 px-3 py-1 text-xs font-semibold ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* Deck comparison — stacked on mobile, side-by-side on sm+ */}
      {/* Mobile: stacked cards */}
      <div className="mb-4 space-y-3 sm:hidden">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
              You offer
            </p>
            {myDecks.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-emerald-400"
                >
                  <line x1="12" x2="12" y1="2" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <p className="text-sm font-semibold text-emerald-400">
                  Cash offer
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myDecks.map((td) => (
                  <div key={td.id} className="flex items-center gap-3">
                    {td.deck?.commander_scryfall_id ? (
                      <img
                        src={scryfallArtUrl(td.deck.commander_scryfall_id)}
                        alt={td.deck.commander_name ?? ''}
                        className="aspect-[5/3] w-24 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="bg-muted aspect-[5/3] w-24 shrink-0 rounded-lg" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {td.deck?.name ?? 'Unknown deck'}
                      </p>
                      {td.deck?.commander_name && (
                        <p className="text-muted-foreground truncate text-xs">
                          {td.deck.commander_name}
                        </p>
                      )}
                      <p className="text-primary mt-1 font-bold">
                        {formatPrice(td.deck?.estimated_value_cents ?? null)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
              You receive
            </p>
            {theirDecks.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-emerald-400"
                >
                  <line x1="12" x2="12" y1="2" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <p className="text-sm font-semibold text-emerald-400">
                  Cash offer
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {theirDecks.map((td) => (
                  <div key={td.id} className="flex items-center gap-3">
                    {td.deck?.commander_scryfall_id ? (
                      <img
                        src={scryfallArtUrl(td.deck.commander_scryfall_id)}
                        alt={td.deck.commander_name ?? ''}
                        className="aspect-[5/3] w-24 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="bg-muted aspect-[5/3] w-24 shrink-0 rounded-lg" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {td.deck?.name ?? 'Unknown deck'}
                      </p>
                      {td.deck?.commander_name && (
                        <p className="text-muted-foreground truncate text-xs">
                          {td.deck.commander_name}
                        </p>
                      )}
                      <p className="text-primary mt-1 font-bold">
                        {formatPrice(td.deck?.estimated_value_cents ?? null)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop: two-column comparison */}
      <Card className="mb-4 hidden sm:block">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 divide-x divide-white/5">
            {/* Your side */}
            <div className="p-5">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
                You offer
              </p>
              {myDecks.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-emerald-400"
                  >
                    <line x1="12" x2="12" y1="2" y2="22" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <p className="text-sm font-semibold text-emerald-400">
                    Cash offer
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myDecks.map((td) => (
                    <div key={td.id}>
                      {td.deck?.commander_scryfall_id ? (
                        <img
                          src={scryfallArtUrl(td.deck.commander_scryfall_id)}
                          alt={td.deck.commander_name ?? ''}
                          className="mb-2 aspect-[5/3] w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="bg-muted mb-2 aspect-[5/3] w-full rounded-lg" />
                      )}
                      <p className="text-sm font-semibold">
                        {td.deck?.name ?? 'Unknown deck'}
                      </p>
                      {td.deck?.commander_name && (
                        <p className="text-muted-foreground text-xs">
                          {td.deck.commander_name}
                        </p>
                      )}
                      <p className="text-primary mt-1 font-bold">
                        {formatPrice(td.deck?.estimated_value_cents ?? null)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Their side */}
            <div className="p-5">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
                You receive
              </p>
              {theirDecks.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-emerald-400"
                  >
                    <line x1="12" x2="12" y1="2" y2="22" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <p className="text-sm font-semibold text-emerald-400">
                    Cash offer
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {theirDecks.map((td) => (
                    <div key={td.id}>
                      {td.deck?.commander_scryfall_id ? (
                        <img
                          src={scryfallArtUrl(td.deck.commander_scryfall_id)}
                          alt={td.deck.commander_name ?? ''}
                          className="mb-2 aspect-[5/3] w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="bg-muted mb-2 aspect-[5/3] w-full rounded-lg" />
                      )}
                      <p className="text-sm font-semibold">
                        {td.deck?.name ?? 'Unknown deck'}
                      </p>
                      {td.deck?.commander_name && (
                        <p className="text-muted-foreground text-xs">
                          {td.deck.commander_name}
                        </p>
                      )}
                      <p className="text-primary mt-1 font-bold">
                        {formatPrice(td.deck?.estimated_value_cents ?? null)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash + messages */}
      <div className="mb-4 space-y-3">
        {cashLabel && (
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[2%] px-4 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <line x1="12" x2="12" y1="2" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <p className="text-sm">{cashLabel}</p>
          </div>
        )}

        {trade.message && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                  {trade.proposer.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold">
                    {trade.proposer.username}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {trade.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {trade.receiver_message && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                  {trade.receiver.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold">
                    {trade.receiver.username}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {trade.receiver_message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review */}
      {trade.status === 'completed' && !myReview && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <ReviewForm
              tradeId={trade.id}
              reviewerId={authUser.id}
              revieweeId={them.id}
              revieweeUsername={them.username}
            />
          </CardContent>
        </Card>
      )}
      {trade.status === 'completed' && myReview && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
              Your review
            </p>
            <p className="text-yellow-400">
              {'★'.repeat(myReview.rating)}
              {'☆'.repeat(5 - myReview.rating)}
            </p>
            {myReview.comment && (
              <p className="text-muted-foreground mt-1 text-sm">
                {myReview.comment}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sticky floating action bar */}
      {['proposed', 'countered', 'accepted'].includes(trade.status) && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl">
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
        </div>
      )}
    </main>
  )
}
