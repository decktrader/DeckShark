import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserTrades } from '@/lib/services/trades.server'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getLastMessage(trade: {
  receiver_message?: string | null
  message?: string | null
}): string | null {
  return trade.receiver_message || trade.message || null
}

function scryfallArtUrl(id: string): string {
  return `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg`
}

function getFirstCommanderArt(
  deckEntries: { deck?: { commander_scryfall_id?: string | null } | null }[],
): string | null {
  for (const td of deckEntries) {
    if (td.deck?.commander_scryfall_id)
      return scryfallArtUrl(td.deck.commander_scryfall_id)
  }
  return null
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

export default async function TradesPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: trades } = await getUserTrades(authUser.id)

  const active = (trades ?? []).filter((t) =>
    ['proposed', 'accepted', 'countered'].includes(t.status),
  )
  const past = (trades ?? []).filter((t) =>
    ['completed', 'cancelled', 'declined', 'disputed'].includes(t.status),
  )

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Trades</h1>

      {(trades ?? []).length === 0 && (
        <p className="text-muted-foreground">
          No trades yet.{' '}
          <Link href="/decks" className="underline">
            Browse decks
          </Link>{' '}
          to propose one.
        </p>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Active
          </h2>
          <div className="space-y-2">
            {active.map((trade) => {
              const isProposer = trade.proposer_id === authUser.id
              const them = isProposer ? trade.receiver : trade.proposer
              const myDecks = trade.trade_decks.filter(
                (td) => td.offered_by === authUser.id,
              )
              const theirDecks = trade.trade_decks.filter(
                (td) => td.offered_by !== authUser.id,
              )
              const status = STATUS_LABELS[trade.status]
              const myValue = myDecks.reduce(
                (sum, td) => sum + (td.deck?.estimated_value_cents ?? 0),
                0,
              )
              const theirValue = theirDecks.reduce(
                (sum, td) => sum + (td.deck?.estimated_value_cents ?? 0),
                0,
              )
              const cash = trade.cash_difference_cents ?? 0
              // Positive = proposer pays
              const cashLabel =
                cash !== 0
                  ? `+ ${formatPrice(Math.abs(cash))} cash ${
                      cash > 0 === isProposer ? '(you pay)' : '(they pay)'
                    }`
                  : null

              return (
                <Link key={trade.id} href={`/trades/${trade.id}`}>
                  <div className="bg-card hover:border-primary/50 rounded-lg border p-4 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {isProposer ? 'You → ' : ''}
                            {them.username}
                            {!isProposer ? ' → You' : ''}
                          </p>
                          {them.city && (
                            <span className="text-muted-foreground text-xs">
                              {them.city}, {them.province}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
                          {getFirstCommanderArt(myDecks) && (
                            <img
                              src={getFirstCommanderArt(myDecks)!}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10"
                            />
                          )}
                          <span className="text-foreground/80">
                            {myDecks
                              .map((td) => td.deck?.name ?? 'Unknown')
                              .join(', ')}
                          </span>
                          <span className="text-muted-foreground">for</span>
                          {getFirstCommanderArt(theirDecks) && (
                            <img
                              src={getFirstCommanderArt(theirDecks)!}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10"
                            />
                          )}
                          <span className="text-foreground/80">
                            {theirDecks
                              .map((td) => td.deck?.name ?? 'Unknown')
                              .join(', ')}
                          </span>
                        </div>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                          <span>
                            {formatPrice(myValue)} → {formatPrice(theirValue)}
                          </span>
                          {cashLabel && <span>{cashLabel}</span>}
                          <span>{timeAgo(trade.updated_at)}</span>
                        </div>
                        {getLastMessage(trade) && (
                          <p className="bg-muted/50 text-foreground/70 mt-2 rounded-md px-2.5 py-1.5 text-xs italic">
                            &ldquo;
                            {getLastMessage(trade)!.length > 50
                              ? `${getLastMessage(trade)!.slice(0, 50)}...`
                              : getLastMessage(trade)}
                            &rdquo;
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Past
          </h2>
          <div className="space-y-2">
            {past.map((trade) => {
              const isProposer = trade.proposer_id === authUser.id
              const them = isProposer ? trade.receiver : trade.proposer
              const myDecks = trade.trade_decks.filter(
                (td) => td.offered_by === authUser.id,
              )
              const theirDecks = trade.trade_decks.filter(
                (td) => td.offered_by !== authUser.id,
              )
              const status = STATUS_LABELS[trade.status]
              const myValue = myDecks.reduce(
                (sum, td) => sum + (td.deck?.estimated_value_cents ?? 0),
                0,
              )
              const theirValue = theirDecks.reduce(
                (sum, td) => sum + (td.deck?.estimated_value_cents ?? 0),
                0,
              )

              return (
                <Link key={trade.id} href={`/trades/${trade.id}`}>
                  <div className="bg-card hover:border-primary/50 rounded-lg border p-4 opacity-70 transition-colors hover:opacity-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{them.username}</p>
                          {them.city && (
                            <span className="text-muted-foreground text-xs">
                              {them.city}, {them.province}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
                          {getFirstCommanderArt(myDecks) && (
                            <img
                              src={getFirstCommanderArt(myDecks)!}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10"
                            />
                          )}
                          <span className="text-foreground/80">
                            {myDecks
                              .map((td) => td.deck?.name ?? 'Unknown')
                              .join(', ')}
                          </span>
                          <span className="text-muted-foreground">for</span>
                          {getFirstCommanderArt(theirDecks) && (
                            <img
                              src={getFirstCommanderArt(theirDecks)!}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10"
                            />
                          )}
                          <span className="text-foreground/80">
                            {theirDecks
                              .map((td) => td.deck?.name ?? 'Unknown')
                              .join(', ')}
                          </span>
                        </div>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                          <span>
                            {formatPrice(myValue)} → {formatPrice(theirValue)}
                          </span>
                          <span>{timeAgo(trade.updated_at)}</span>
                        </div>
                        {getLastMessage(trade) && (
                          <p className="bg-muted/50 text-foreground/70 mt-2 rounded-md px-2.5 py-1.5 text-xs italic">
                            &ldquo;
                            {getLastMessage(trade)!.length > 50
                              ? `${getLastMessage(trade)!.slice(0, 50)}...`
                              : getLastMessage(trade)}
                            &rdquo;
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
