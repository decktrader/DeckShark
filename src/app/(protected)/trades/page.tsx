import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserTrades } from '@/lib/services/trades.server'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
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

              return (
                <Link key={trade.id} href={`/trades/${trade.id}`}>
                  <div className="bg-card hover:border-primary/50 rounded-lg border p-4 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {isProposer ? 'You → ' : ''}
                          {them.username}
                          {!isProposer ? ' → You' : ''}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {myDecks.map((td) => td.deck.name).join(', ')} for{' '}
                          {theirDecks.map((td) => td.deck.name).join(', ')}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold ${status.color}`}>
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

              return (
                <Link key={trade.id} href={`/trades/${trade.id}`}>
                  <div className="bg-card hover:border-primary/50 rounded-lg border p-4 opacity-70 transition-colors hover:opacity-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{them.username}</p>
                        <p className="text-muted-foreground text-sm">
                          {myDecks.map((td) => td.deck.name).join(', ')} for{' '}
                          {theirDecks.map((td) => td.deck.name).join(', ')}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold ${status.color}`}>
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
