import Link from 'next/link'
import { getAdminTrades } from '@/lib/services/admin.server'
import { PaginationNav } from '@/components/ui/pagination-nav'

const PAGE_SIZE = 25

const STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-sky-500/20 text-sky-300',
  accepted: 'bg-emerald-500/20 text-emerald-300',
  countered: 'bg-amber-500/20 text-amber-300',
  completed: 'bg-green-500/20 text-green-300',
  declined: 'bg-red-500/20 text-red-300',
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
                : 'border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      {/* Trades table */}
      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[2%]">
              <th className="px-4 py-3 text-left font-medium">Proposer</th>
              <th className="px-4 py-3 text-left font-medium">Receiver</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Cash diff</th>
              <th className="px-4 py-3 text-right font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-white/[2%]">
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
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_COLORS[trade.status] ?? 'bg-white/10 text-white/60'}`}
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
