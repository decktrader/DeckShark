'use client'

import { useState } from 'react'

type Range = '7d' | '30d' | '90d' | '1y'
type Metric = 'users' | 'decks' | 'listed' | 'trades'

interface ChartDataPoint {
  date: string
  users: number
  decks: number
  listed: number
  trades: number
}

interface Totals {
  new_users: number
  new_decks: number
  listed_for_trade: number
  new_trades: number
  completed_trades: number
}

const RANGE_LABELS: Record<Range, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  '1y': '1 year',
}

const METRIC_CONFIG: Record<
  Metric,
  { label: string; color: string; totalKey: keyof Totals }
> = {
  users: { label: 'New users', color: '#8b5cf6', totalKey: 'new_users' },
  decks: { label: 'New decks', color: '#0ea5e9', totalKey: 'new_decks' },
  listed: {
    label: 'Listed for trade',
    color: '#10b981',
    totalKey: 'listed_for_trade',
  },
  trades: { label: 'New trades', color: '#f59e0b', totalKey: 'new_trades' },
}

function BarChart({
  data,
  metric,
  color,
}: {
  data: ChartDataPoint[]
  metric: Metric
  color: string
}) {
  if (data.length === 0) return null

  const values = data.map((d) => d[metric])
  const max = Math.max(...values, 1)
  const chartHeight = 220

  // Show ~6 date labels evenly spaced
  const labelInterval = Math.max(1, Math.floor(data.length / 6))

  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height: chartHeight }}>
        {data.map((point) => {
          const value = point[metric]
          const pct = max > 0 ? (value / max) * 100 : 0
          // Use pixel height directly for reliability
          const barHeight = Math.round((pct / 100) * chartHeight)
          return (
            <div
              key={point.date}
              className="group relative flex-1"
              style={{ height: chartHeight }}
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-sm"
                style={{
                  height: value > 0 ? Math.max(barHeight, 4) : 0,
                  backgroundColor: color,
                }}
              />
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg group-hover:block">
                <p className="font-bold">{value}</p>
                <p className="text-muted-foreground">
                  {formatDate(point.date, data.length > 60)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {/* Axis labels */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-1 justify-between">
          {data
            .filter(
              (_, idx) => idx % labelInterval === 0 || idx === data.length - 1,
            )
            .map((point) => (
              <span
                key={point.date}
                className="text-muted-foreground text-[10px]"
              >
                {formatDate(point.date, data.length > 60)}
              </span>
            ))}
        </div>
      </div>
      <div className="text-muted-foreground mt-1 flex justify-between text-[10px]">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function formatDate(dateStr: string, short: boolean): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (short) {
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  })
}

export function GrowthCharts({
  initialData,
  initialTotals,
}: {
  initialData: ChartDataPoint[]
  initialTotals: Totals | null
}) {
  const [range, setRange] = useState<Range>('30d')
  const [data, setData] = useState<ChartDataPoint[]>(initialData)
  const [totals, setTotals] = useState<Totals | null>(initialTotals)
  const [loading, setLoading] = useState(false)
  const [activeMetric, setActiveMetric] = useState<Metric>('users')

  function changeRange(r: Range) {
    setRange(r)
    setLoading(true)
    fetch(`/api/admin/growth-chart?range=${r}`)
      .then((res) => res.json())
      .then((result) => {
        setData(result.chart ?? [])
        setTotals(result.totals ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const config = METRIC_CONFIG[activeMetric]

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Growth</h1>
        <div className="flex gap-1">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => changeRange(r)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? 'border-primary text-primary'
                  : 'border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {totals && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(METRIC_CONFIG) as Metric[]).map((m) => {
            const c = METRIC_CONFIG[m]
            const isActive = activeMetric === m
            return (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`overflow-hidden rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-white/20 bg-white/[4%]'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div
                  className="h-1 w-full"
                  style={{
                    backgroundColor: isActive ? c.color : 'transparent',
                  }}
                />
                <div className="p-4">
                  <p className="text-2xl font-black">{totals[c.totalKey]}</p>
                  <p className="text-muted-foreground text-xs">{c.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl border border-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <h2 className="text-sm font-bold">{config.label}</h2>
          <span className="text-muted-foreground text-xs">
            Last {RANGE_LABELS[range]}
          </span>
        </div>

        {loading ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
            No data for this period
          </div>
        ) : (
          <BarChart data={data} metric={activeMetric} color={config.color} />
        )}
      </div>
    </div>
  )
}
