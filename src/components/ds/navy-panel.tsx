import { cn } from '@/lib/utils'

/**
 * NavyPanel — the workhorse for any ranked marketplace data (Market Pulse,
 * tables, leaderboards). Midnight navy on warm paper.
 */
export function NavyPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'bg-navy text-paper shadow-panel overflow-hidden rounded-xl',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Panel header: title, optional "signature" badge, optional mono signal caption. */
export function PanelHead({
  title,
  badge,
  signal,
  className,
}: {
  title: React.ReactNode
  badge?: string
  signal?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-line-navy flex items-center gap-2.5 border-b px-4 py-3.5',
        className,
      )}
    >
      <span className="font-display text-base font-bold">{title}</span>
      {badge && (
        <span className="bg-brass/20 text-brass-bright rounded-sm px-1.5 py-[3px] font-mono text-[8.5px] font-semibold tracking-[0.1em] uppercase">
          {badge}
        </span>
      )}
      {signal && (
        <span className="text-paper/40 ml-auto font-mono text-[9.5px] tracking-[0.06em] uppercase">
          {signal}
        </span>
      )}
    </div>
  )
}

/**
 * DivergingBar — terracotta demand (left) vs teal supply (right). Pass two
 * percentages; they should sum to ~100.
 */
export function DivergingBar({
  demand,
  supply,
  className,
}: {
  demand: number
  supply: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-paper/10 flex h-[9px] overflow-hidden rounded-sm',
        className,
      )}
    >
      <span className="bg-terra h-full" style={{ width: `${demand}%` }} />
      <span
        className="bg-teal ml-auto h-full"
        style={{ width: `${supply}%` }}
      />
    </div>
  )
}
