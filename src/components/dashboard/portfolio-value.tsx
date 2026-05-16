'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface PortfolioValueProps {
  totalValue: number
  totalChange: number
  deckCount: number
  tradingCount: number
  activeTrades: number
  completedTrades: number
}

export function PortfolioValue({
  totalValue,
  totalChange,
  deckCount,
  tradingCount,
  activeTrades,
  completedTrades,
}: PortfolioValueProps) {
  const changePercent =
    totalValue > 0 && totalChange !== 0
      ? Math.round((Math.abs(totalChange) / (totalValue - totalChange)) * 100)
      : 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-b from-violet-500/[0.06] to-[#09090b] text-center">
      {/* Glow */}
      <div className="pointer-events-none absolute top-2 left-1/2 h-20 w-48 -translate-x-1/2 rounded-full bg-violet-500/[0.12] blur-3xl" />

      <div className="relative px-6 pt-6 pb-5">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
          Collection Value
        </p>
        <p className="mt-1.5 text-5xl font-black tracking-tight">
          <span className="text-violet-400">$</span>
          {totalValue > 0 ? Math.round(totalValue / 100).toLocaleString() : '0'}
        </p>

        {totalChange !== 0 && (
          <div className="mt-2 inline-flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-1 text-sm font-semibold ${
                totalChange > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {totalChange > 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {totalChange > 0 ? '+' : '-'}
              {formatPrice(Math.abs(totalChange), { decimals: false })}
            </span>
            <span className="text-[11px] text-[#3f3f46]">
              this week{changePercent > 0 ? ` · ${changePercent}%` : ''}
            </span>
          </div>
        )}

        <div className="mt-5 flex justify-center gap-3">
          <div className="min-w-[72px] rounded-[10px] border border-white/[0.06] bg-white/[0.04] px-4 py-2.5">
            <p className="text-lg font-extrabold">{deckCount}</p>
            <p className="text-[9px] text-[#52525b]">Decks</p>
          </div>
          <div className="min-w-[72px] rounded-[10px] border border-white/[0.06] bg-white/[0.04] px-4 py-2.5">
            <p className="text-lg font-extrabold text-emerald-400">
              {tradingCount}
            </p>
            <p className="text-[9px] text-[#52525b]">Trading</p>
          </div>
          <div className="min-w-[72px] rounded-[10px] border border-white/[0.06] bg-white/[0.04] px-4 py-2.5">
            <p className="text-lg font-extrabold">{activeTrades}</p>
            <p className="text-[9px] text-[#52525b]">Active</p>
          </div>
          <div className="min-w-[72px] rounded-[10px] border border-white/[0.06] bg-white/[0.04] px-4 py-2.5">
            <p className="text-lg font-extrabold">{completedTrades}</p>
            <p className="text-[9px] text-[#52525b]">Completed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
