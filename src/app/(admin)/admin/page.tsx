import {
  getAdminStats,
  getGrowthData,
  getGeographicDistribution,
} from '@/lib/services/admin.server'

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <div
        className={`h-1 w-full bg-gradient-to-r ${accent ?? 'from-white/20'} to-transparent`}
      />
      <div className="p-4">
        <p className="text-2xl font-black">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const [
    { data: stats },
    { data: userGrowth },
    { data: deckGrowth },
    { data: tradeGrowth },
    { data: geo },
  ] = await Promise.all([
    getAdminStats(),
    getGrowthData('users', 30),
    getGrowthData('decks', 30),
    getGrowthData('trades', 30),
    getGeographicDistribution(),
  ])

  const s = stats ?? {
    total_users: 0,
    total_decks: 0,
    active_trades: 0,
    completed_trades: 0,
    total_want_lists: 0,
    total_trade_value_cents: 0,
    open_reports: 0,
    new_feedback: 0,
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Platform overview and metrics
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={s.total_users}
          accent="from-violet-500/80"
        />
        <StatCard
          label="Active decks"
          value={s.total_decks}
          accent="from-sky-500/80"
        />
        <StatCard
          label="Active trades"
          value={s.active_trades}
          accent="from-amber-500/80"
        />
        <StatCard
          label="Completed trades"
          value={s.completed_trades}
          accent="from-emerald-500/80"
        />
        <StatCard
          label="Want lists"
          value={s.total_want_lists}
          accent="from-rose-500/80"
        />
        <StatCard
          label="Total trade value"
          value={formatPrice(s.total_trade_value_cents)}
          accent="from-emerald-500/80"
        />
        <StatCard
          label="Open reports"
          value={s.open_reports}
          accent={s.open_reports > 0 ? 'from-red-500/80' : 'from-white/20'}
        />
        <StatCard
          label="New feedback"
          value={s.new_feedback}
          accent={s.new_feedback > 0 ? 'from-amber-500/80' : 'from-white/20'}
        />
      </div>

      {/* Growth tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GrowthTable title="New users (30d)" rows={userGrowth ?? []} />
        <GrowthTable title="New decks (30d)" rows={deckGrowth ?? []} />
        <GrowthTable title="New trades (30d)" rows={tradeGrowth ?? []} />
      </div>

      {/* Geographic distribution */}
      {geo && geo.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold">Users by province</h2>
          <div className="rounded-xl border border-white/5">
            <div className="divide-y divide-white/5">
              {geo.map((row) => (
                <div
                  key={row.province}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm">{row.province}</span>
                  <span className="text-muted-foreground text-sm font-medium">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GrowthTable({
  title,
  rows,
}: {
  title: string
  rows: { date: string; count: number }[]
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0)

  return (
    <div>
      <h2 className="mb-3 text-lg font-bold">
        {title}{' '}
        <span className="text-muted-foreground text-sm font-normal">
          ({total})
        </span>
      </h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No activity</p>
      ) : (
        <div className="rounded-xl border border-white/5">
          <div className="max-h-64 overflow-y-auto">
            <div className="divide-y divide-white/5">
              {rows.map((row) => (
                <div
                  key={row.date}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <span className="text-muted-foreground text-xs">
                    {row.date}
                  </span>
                  <span className="text-sm font-medium">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
