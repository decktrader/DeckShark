'use client'

import { useState, useEffect } from 'react'

type Period = 'day' | 'week' | 'month' | 'year'

interface Metrics {
  new_users: number
  new_decks: number
  listed_for_trade: number
  new_trades: number
  completed_trades: number
}

const PERIOD_LABELS: Record<Period, string> = {
  day: '24h',
  week: '7d',
  month: '30d',
  year: '1y',
}

export function GrowthMetrics() {
  const [period, setPeriod] = useState<Period>('month')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  function changePeriod(p: Period) {
    setLoading(true)
    setPeriod(p)
  }

  useEffect(() => {
    let cancelled = false
    fetch(`/api/admin/growth?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setMetrics(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  const rows = metrics
    ? [
        {
          label: 'New users',
          value: metrics.new_users,
          accent: 'bg-slate',
        },
        { label: 'New decks', value: metrics.new_decks, accent: 'bg-teal' },
        {
          label: 'Listed for trade',
          value: metrics.listed_for_trade,
          accent: 'bg-teal',
        },
        {
          label: 'New trades',
          value: metrics.new_trades,
          accent: 'bg-brass',
        },
        {
          label: 'Completed trades',
          value: metrics.completed_trades,
          accent: 'bg-teal',
        },
      ]
    : []

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Growth</h2>
        <div className="flex gap-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => changePeriod(p)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? 'border-primary text-primary'
                  : 'border-line text-slate hover:border-line'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="border-line rounded-xl border">
        {loading ? (
          <div className="text-muted-foreground p-6 text-center text-sm">
            Loading...
          </div>
        ) : (
          <div className="divide-line divide-y">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${row.accent}`} />
                  <span className="text-sm">{row.label}</span>
                </div>
                <span className="text-xl font-black">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
