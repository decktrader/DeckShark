import { getFeedback } from '@/lib/services/admin.server'
import { updateFeedbackAction } from '@/app/(admin)/admin/actions'
import { PaginationNav } from '@/components/ui/pagination-nav'
import Link from 'next/link'
import type { FeedbackStatus } from '@/types'

const PAGE_SIZE = 25

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-sky-500/20 text-sky-300',
  reviewed: 'bg-amber-500/20 text-amber-300',
  archived: 'bg-zinc-500/20 text-zinc-400',
}

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'text-red-400',
  feature: 'text-violet-400',
  general: 'text-zinc-400',
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const statusFilter = (params.status as FeedbackStatus) ?? ''

  const { data: result } = await getFeedback({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter || undefined,
  })

  const items = result?.feedback ?? []
  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const statuses: ('' | FeedbackStatus)[] = ['', 'new', 'reviewed', 'archived']

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Feedback</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total} item{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s ? `/admin/feedback?status=${s}` : '/admin/feedback'}
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

      {items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No feedback yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((fb) => (
            <div key={fb.id} className="rounded-xl border border-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_COLORS[fb.status]}`}
                    >
                      {fb.status}
                    </span>
                    <span
                      className={`text-xs font-medium capitalize ${CATEGORY_COLORS[fb.category]}`}
                    >
                      {fb.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{fb.message}</p>
                  <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
                    <span>
                      {new Date(fb.created_at).toLocaleDateString('en-CA')}
                    </span>
                    {fb.page_url && <span>Page: {fb.page_url}</span>}
                    {fb.user_agent && (
                      <span className="max-w-xs truncate">{fb.user_agent}</span>
                    )}
                  </div>
                  {fb.admin_notes && (
                    <p className="mt-2 text-xs text-amber-400">
                      Admin notes: {fb.admin_notes}
                    </p>
                  )}
                </div>

                {fb.status === 'new' && (
                  <div className="flex shrink-0 gap-1">
                    <form action={updateFeedbackAction}>
                      <input type="hidden" name="feedbackId" value={fb.id} />
                      <input type="hidden" name="status" value="reviewed" />
                      <button
                        type="submit"
                        className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30"
                      >
                        Mark reviewed
                      </button>
                    </form>
                    <form action={updateFeedbackAction}>
                      <input type="hidden" name="feedbackId" value={fb.id} />
                      <input type="hidden" name="status" value="archived" />
                      <button
                        type="submit"
                        className="rounded-md bg-zinc-500/20 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-500/30"
                      >
                        Archive
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
          return str ? `/admin/feedback?${str}` : '/admin/feedback'
        }}
      />
    </div>
  )
}
