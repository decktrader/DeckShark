interface PortfolioValueProps {
  totalValue: number
  totalChange: number
  deckCount: number
  tradingCount: number
  activeTrades: number
  completedTrades: number
}

function usd(cents: number): string {
  return '$' + Math.round(cents / 100).toLocaleString('en-US')
}

function Cell({ v, l }: { v: number; l: string }) {
  return (
    <div className="border-line-navy border-t p-5 md:border-t-0 md:border-l">
      <div className="font-display text-2xl font-bold">{v}</div>
      <div className="text-paper/60 mt-1.5 text-[11px] leading-tight">{l}</div>
    </div>
  )
}

/** Collection value panel (community language, not "portfolio"). Navy band. */
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
  const up = totalChange > 0

  return (
    <div className="bg-navy text-paper shadow-panel overflow-hidden rounded-xl">
      <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="md:border-line-navy col-span-2 p-6 md:col-span-1 md:border-r">
          <div className="text-paper/55 font-mono text-[10px] tracking-[0.14em] uppercase">
            Your collection value
          </div>
          <div className="mt-1.5 font-mono text-[38px] font-semibold tracking-[-0.02em]">
            {usd(totalValue)}
          </div>
          {totalChange !== 0 && (
            <div
              className={`mt-1.5 font-mono text-[12.5px] ${up ? 'text-teal-bright' : 'text-terra-bright'}`}
            >
              {up ? '+' : '-'}
              {usd(Math.abs(totalChange))}
              {changePercent > 0 && ` (${up ? '+' : '-'}${changePercent}%)`}
            </div>
          )}
        </div>
        <Cell v={deckCount} l="Decks owned" />
        <Cell v={tradingCount} l="Available to trade" />
        <Cell v={activeTrades} l="Active trades" />
        <Cell v={completedTrades} l="Trades completed" />
      </div>
    </div>
  )
}
