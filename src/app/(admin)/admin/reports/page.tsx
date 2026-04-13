import { getReports } from '@/lib/services/admin.server'
import { updateReportAction } from '@/app/(admin)/admin/actions'
import { PaginationNav } from '@/components/ui/pagination-nav'
import Link from 'next/link'
import type { ReportStatus } from '@/types'

const PAGE_SIZE = 25

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/20 text-red-300',
  reviewed: 'bg-amber-500/20 text-amber-300',
  resolved: 'bg-emerald-500/20 text-emerald-300',
  dismissed: 'bg-zinc-500/20 text-zinc-400',
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const statusFilter = (params.status as ReportStatus) ?? ''

  const { data: result } = await getReports({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter || undefined,
  })

  const reports = result?.reports ?? []
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const statuses: ('' | ReportStatus)[] = [
    '',
    'open',
    'reviewed',
    'resolved',
    'dismissed',
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total} report{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s ? `/admin/reports?status=${s}` : '/admin/reports'}
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

      {reports.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No reports found.
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_COLORS[report.status]}`}
                    >
                      {report.status}
                    </span>
                    <span className="text-muted-foreground text-xs capitalize">
                      {report.target_type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{report.reason}</p>
                  {report.description && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {report.description}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2 text-xs">
                    Reported by {report.reporter.username} ·{' '}
                    {new Date(report.created_at).toLocaleDateString('en-CA')}
                  </p>
                  {report.admin_notes && (
                    <p className="mt-2 text-xs text-amber-400">
                      Admin notes: {report.admin_notes}
                    </p>
                  )}
                </div>

                {report.status === 'open' && (
                  <div className="flex shrink-0 gap-1">
                    <form action={updateReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="resolved" />
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
                      >
                        Resolve
                      </button>
                    </form>
                    <form action={updateReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="dismissed" />
                      <button
                        type="submit"
                        className="rounded-md bg-zinc-500/20 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-500/30"
                      >
                        Dismiss
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationNav
        page={page}
        totalPages={totalPages}
        buildUrl={(p) => {
          const qs = new URLSearchParams()
          if (statusFilter) qs.set('status', statusFilter)
          if (p > 1) qs.set('page', String(p))
          const str = qs.toString()
          return str ? `/admin/reports?${str}` : '/admin/reports'
        }}
      />
    </div>
  )
}
