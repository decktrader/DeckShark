import Link from 'next/link'
import { getAdminTrades } from '@/lib/services/admin.server'
import { PaginationNav } from '@/components/ui/pagination-nav'

const PAGE_SIZE = 25

const STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-teal/15 text-teal-deep',
  accepted: 'bg-teal/15 text-teal-deep',
  countered: 'bg-brass/15 text-brass-deep',
  completed: 'bg-teal/15 text-teal-deep',
  declined: 'bg-terra/15 text-terra-deep',
  cancelled: 'bg-zinc-500/20 text-zinc-400',
}

export default async function AdminTradesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const statusFilter = params.status ?? ''

  const { data: result } = await getAdminTrades({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter || undefined,
  })

  const trades = result?.trades ?? []
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const statuses = [
    '',
    'proposed',
    'accepted',
    'countered',
    'completed',
    'declined',
    'cancelled',
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Trades</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total} trade{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s ? `/admin/trades?status=${s}` : '/admin/trades'}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'border-primary text-primary'
                : 'border-line text-slate hover:border-line'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      {/* Trades table */}
      <div className="border-line overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line bg-paper-2 border-b">
              <th className="px-4 py-3 text-left font-medium">Proposer</th>
              <th className="px-4 py-3 text-left font-medium">Receiver</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Cash diff</th>
              <th className="px-4 py-3 text-right font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-paper-2">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${trade.proposer.id}`}
                    className="hover:underline"
                  >
                    {trade.proposer.username}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${trade.receiver.id}`}
                    className="hover:underline"
                  >
                    {trade.receiver.username}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_COLORS[trade.status] ?? 'bg-paper-2 text-slate'}`}
                  >
                    {trade.status}
                  </span>
                </td>
                <td className="text-muted-foreground px-4 py-3 text-right">
                  {trade.cash_difference_cents
                    ? `$${(trade.cash_difference_cents / 100).toFixed(2)}`
                    : '—'}
                </td>
                <td className="text-muted-foreground px-4 py-3 text-right">
                  {new Date(trade.updated_at).toLocaleDateString('en-CA')}
                </td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  No trades found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationNav
        page={page}
        totalPages={totalPages}
        buildUrl={(p) => {
          const qs = new URLSearchParams()
          if (statusFilter) qs.set('status', statusFilter)
          if (p > 1) qs.set('page', String(p))
          const str = qs.toString()
          return str ? `/admin/trades?${str}` : '/admin/trades'
        }}
      />
    </div>
  )
}
