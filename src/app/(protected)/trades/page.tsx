import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserTrades } from '@/lib/services/trades.server'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

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

function scryfallArtUrl(id: string): string {
  return `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg`
}

function firstArt(
  deckEntries: { deck?: { commander_scryfall_id?: string | null } | null }[],
): string | null {
  for (const td of deckEntries) {
    if (td.deck?.commander_scryfall_id)
      return scryfallArtUrl(td.deck.commander_scryfall_id)
  }
  return null
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

type Trade = NonNullable<
  Awaited<ReturnType<typeof getUserTrades>>['data']
>[number]

function Thumb({ src }: { src: string | null }) {
  return (
    <div
      className="rounded-card-sm h-[50px] w-[50px] border-2 border-white bg-[#0c2030] bg-cover bg-center shadow-[0_1px_4px_rgba(0,0,0,0.2)] last:-ml-3.5"
      style={src ? { backgroundImage: `url(${src})` } : undefined}
    />
  )
}

function TradeRow({
  trade,
  meId,
  past,
}: {
  trade: Trade
  meId: string
  past?: boolean
}) {
  const isProposer = trade.proposer_id === meId
  const them = isProposer ? trade.receiver : trade.proposer
  const myDecks = trade.trade_decks.filter((td) => td.offered_by === meId)
  const theirDecks = trade.trade_decks.filter((td) => td.offered_by !== meId)
  const myValue = myDecks.reduce(
    (s, td) => s + (td.deck?.estimated_value_cents ?? 0),
    0,
  )
  const theirValue = theirDecks.reduce(
    (s, td) => s + (td.deck?.estimated_value_cents ?? 0),
    0,
  )
  const cash = trade.cash_difference_cents ?? 0
  const cashLabel =
    cash !== 0
      ? `+${formatPrice(Math.abs(cash), { decimals: false })} cash`
      : null
  const opts = { decimals: false } as const

  return (
    <Link
      href={`/trades/${trade.id}`}
      className={`border-line hover:border-terra hover:shadow-card flex items-center gap-3.5 rounded-lg border bg-white p-[13px] transition-[transform,box-shadow,border-color,opacity] hover:-translate-y-0.5 ${past ? 'opacity-[0.72] hover:opacity-100' : ''}`}
    >
      <div className="flex shrink-0">
        <Thumb src={firstArt(myDecks)} />
        <Thumb src={firstArt(theirDecks)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-ink flex min-w-0 items-center gap-1.5 text-sm font-bold">
            {isProposer ? (
              <>
                You <span className="text-brass-deep">→</span>{' '}
                <span className="truncate">{them.username}</span>
              </>
            ) : (
              <>
                <span className="truncate">{them.username}</span>{' '}
                <span className="text-brass-deep">→</span> You
              </>
            )}
          </span>
          <span
            className={`rounded-pill shrink-0 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] uppercase ${STATUS_PILL[trade.status] ?? 'bg-paper-3 text-slate'}`}
          >
            {trade.status}
          </span>
        </div>
        <div className="text-ink-2 mt-1 truncate text-xs">
          {myDecks.map((td) => td.deck?.name ?? '?').join(', ')}
          {' for '}
          {theirDecks.map((td) => td.deck?.name ?? '?').join(', ')}
        </div>
        <div className="mt-1.5 flex items-center gap-2.5 font-mono text-[11px]">
          <span className="text-teal-deep font-semibold whitespace-nowrap">
            {formatPrice(myValue, opts)} → {formatPrice(theirValue, opts)}
          </span>
          {cashLabel && <span className="text-brass-deep">{cashLabel}</span>}
          <span className="text-ink-3 ml-auto">
            {timeAgo(trade.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function SummaryCard({
  v,
  label,
  tone,
}: {
  v: number
  label: string
  tone?: 'teal' | 'brass'
}) {
  return (
    <div className="border-line min-w-[120px] flex-1 rounded-lg border bg-white px-[15px] py-3">
      <div
        className={`font-display text-[22px] font-bold ${tone === 'teal' ? 'text-teal-deep' : tone === 'brass' ? 'text-brass-deep' : ''}`}
      >
        {v}
      </div>
      <div className="text-slate mt-0.5 text-[11.5px]">{label}</div>
    </div>
  )
}

export default async function TradesPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: trades } = await getUserTrades(authUser.id)
  const all = trades ?? []

  const active = all.filter((t) =>
    ['proposed', 'accepted', 'countered'].includes(t.status),
  )
  const past = all.filter((t) =>
    ['completed', 'cancelled', 'declined', 'disputed'].includes(t.status),
  )

  const awaitingYou = active.filter(
    (t) => t.status === 'proposed' && t.receiver_id === authUser.id,
  ).length
  const acceptedCount = active.filter((t) => t.status === 'accepted').length
  const completedCount = past.filter((t) => t.status === 'completed').length

  return (
    <main className="mx-auto max-w-[720px] px-[30px] pt-[26px] pb-[60px]">
      <div className="flex items-center justify-between gap-3.5">
        <div>
          <h1 className="font-display text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.02em]">
            Your trades
          </h1>
          <div className="text-ink-2 mt-1 text-[13.5px]">
            Proposals, counters, and completed swaps
          </div>
        </div>
        <Button asChild variant="terra" size="sm">
          <Link href="/decks">Propose a trade</Link>
        </Button>
      </div>

      {all.length === 0 ? (
        <p className="text-ink-2 mt-8">
          No trades yet.{' '}
          <Link href="/decks" className="text-terra-deep font-semibold">
            Browse decks
          </Link>{' '}
          to propose one.
        </p>
      ) : (
        <>
          <div className="my-6 flex flex-wrap gap-2.5">
            <SummaryCard v={awaitingYou} label="Awaiting you" tone="brass" />
            <SummaryCard
              v={acceptedCount}
              label="Accepted, meet up"
              tone="teal"
            />
            <SummaryCard v={completedCount} label="Completed" />
          </div>

          {active.length > 0 && (
            <>
              <div className="text-slate mt-6 mb-3 flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.12em] uppercase">
                Active <span className="text-ink-3">{active.length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {active.map((t) => (
                  <TradeRow key={t.id} trade={t} meId={authUser.id} />
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <div className="text-slate mt-6 mb-3 flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.12em] uppercase">
                Past <span className="text-ink-3">{past.length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {past.map((t) => (
                  <TradeRow key={t.id} trade={t} meId={authUser.id} past />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  )
}
