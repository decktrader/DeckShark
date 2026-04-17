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
      <h1 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">Trades</h1>

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
                  <div className="bg-card hover:border-primary/50 rounded-lg border p-3 transition-colors sm:p-4">
                    <div className="flex items-center gap-3">
                      {/* Art thumbnails */}
                      <div className="flex shrink-0 -space-x-2">
                        {getFirstCommanderArt(myDecks) ? (
                          <img
                            src={getFirstCommanderArt(myDecks)!}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover ring-2 ring-zinc-900 sm:h-12 sm:w-12"
                          />
                        ) : (
                          <div className="bg-muted h-10 w-10 rounded-lg ring-2 ring-zinc-900 sm:h-12 sm:w-12" />
                        )}
                        {getFirstCommanderArt(theirDecks) ? (
                          <img
                            src={getFirstCommanderArt(theirDecks)!}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover ring-2 ring-zinc-900 sm:h-12 sm:w-12"
                          />
                        ) : (
                          <div className="bg-muted h-10 w-10 rounded-lg ring-2 ring-zinc-900 sm:h-12 sm:w-12" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {isProposer ? 'You → ' : ''}
                            {them.username}
                            {!isProposer ? ' → You' : ''}
                          </p>
                          <span
                            className={`shrink-0 text-[10px] font-semibold sm:text-xs ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {myDecks.map((td) => td.deck?.name ?? '?').join(', ')}
                          {' for '}
                          {theirDecks
                            .map((td) => td.deck?.name ?? '?')
                            .join(', ')}
                        </p>
                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[10px] sm:text-xs">
                          <span className="text-emerald-400/80">
                            {formatPrice(myValue)} → {formatPrice(theirValue)}
                          </span>
                          {cashLabel && (
                            <span className="hidden sm:inline">
                              {cashLabel}
                            </span>
                          )}
                          <span>{timeAgo(trade.updated_at)}</span>
                        </div>
                      </div>
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
                  <div className="bg-card hover:border-primary/50 rounded-lg border p-3 opacity-70 transition-colors hover:opacity-100 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex shrink-0 -space-x-2">
                        {getFirstCommanderArt(myDecks) ? (
                          <img
                            src={getFirstCommanderArt(myDecks)!}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover ring-2 ring-zinc-900 sm:h-12 sm:w-12"
                          />
                        ) : (
                          <div className="bg-muted h-10 w-10 rounded-lg ring-2 ring-zinc-900 sm:h-12 sm:w-12" />
                        )}
                        {getFirstCommanderArt(theirDecks) ? (
                          <img
                            src={getFirstCommanderArt(theirDecks)!}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover ring-2 ring-zinc-900 sm:h-12 sm:w-12"
                          />
                        ) : (
                          <div className="bg-muted h-10 w-10 rounded-lg ring-2 ring-zinc-900 sm:h-12 sm:w-12" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {them.username}
                          </p>
                          <span
                            className={`shrink-0 text-[10px] font-semibold sm:text-xs ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {myDecks.map((td) => td.deck?.name ?? '?').join(', ')}
                          {' for '}
                          {theirDecks
                            .map((td) => td.deck?.name ?? '?')
                            .join(', ')}
                        </p>
                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[10px] sm:text-xs">
                          <span className="text-emerald-400/80">
                            {formatPrice(myValue)} → {formatPrice(theirValue)}
                          </span>
                          <span>{timeAgo(trade.updated_at)}</span>
                        </div>
                      </div>
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
