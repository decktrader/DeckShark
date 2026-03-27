import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTrade } from '@/lib/services/trades.server'
import { TradeActions } from '@/components/trades/trade-actions'

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
  const myDecks = trade.trade_decks.filter(
    (td) => td.offered_by === authUser.id,
  )
  const theirDecks = trade.trade_decks.filter(
    (td) => td.offered_by !== authUser.id,
  )
  const them = isProposer ? trade.receiver : trade.proposer
  const status = STATUS_LABELS[trade.status] ?? {
    label: trade.status,
    color: '',
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/trades"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← All trades
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Trade with{' '}
            <Link
              href={`/profile/${them.username}`}
              className="hover:underline"
            >
              {them.username}
            </Link>
          </h1>
          <p className="text-muted-foreground text-sm">
            {them.city && `${them.city}, ${them.province}`}
          </p>
        </div>
        <span className={`text-sm font-semibold ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Your side */}
        <div>
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            You&apos;re offering
          </h2>
          <div className="space-y-3">
            {myDecks.map((td) => (
              <div
                key={td.id}
                className="bg-card flex items-center gap-3 rounded-lg border p-3"
              >
                {td.deck.commander_scryfall_id && (
                  <img
                    src={scryfallArtUrl(td.deck.commander_scryfall_id)}
                    alt={td.deck.commander_name ?? ''}
                    className="h-12 w-16 rounded object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{td.deck.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatPrice(td.deck.estimated_value_cents)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Their side */}
        <div>
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            You&apos;d receive
          </h2>
          <div className="space-y-3">
            {theirDecks.map((td) => (
              <div
                key={td.id}
                className="bg-card flex items-center gap-3 rounded-lg border p-3"
              >
                {td.deck.commander_scryfall_id && (
                  <img
                    src={scryfallArtUrl(td.deck.commander_scryfall_id)}
                    alt={td.deck.commander_name ?? ''}
                    className="h-12 w-16 rounded object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{td.deck.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatPrice(td.deck.estimated_value_cents)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash difference */}
      {trade.cash_difference_cents !== 0 && (
        <p className="text-muted-foreground mt-4 text-sm">
          {trade.cash_difference_cents > 0
            ? `${isProposer ? 'You pay' : 'They pay'} ${formatPrice(trade.cash_difference_cents)} to sweeten the deal`
            : `${isProposer ? 'They pay' : 'You pay'} ${formatPrice(Math.abs(trade.cash_difference_cents))} to sweeten the deal`}
        </p>
      )}

      {/* Message */}
      {trade.message && (
        <div className="bg-card mt-6 rounded-lg border p-4">
          <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
            Message from {trade.proposer.username}
          </p>
          <p className="text-sm">{trade.message}</p>
        </div>
      )}

      {/* Actions */}
      {['proposed', 'accepted'].includes(trade.status) && (
        <div className="mt-8">
          <TradeActions trade={trade} userId={authUser.id} />
        </div>
      )}
    </main>
  )
}
