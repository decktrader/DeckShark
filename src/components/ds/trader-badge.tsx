import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Pfp } from '@/components/ds/pfp'

/**
 * TraderBadge — convention-badge treatment for a trader (profile cards,
 * Active Traders, Community). Navy cap, overhanging avatar, optional
 * Founding-member ribbon and "trading now" status. Distinct from the
 * trade-status TradeBadge.
 */
export function TraderBadge({
  username,
  city,
  completedTrades,
  avatarUrl,
  founding = false,
  tradingNow = false,
  href,
  className,
}: {
  username: string
  city?: string | null
  completedTrades?: number | null
  avatarUrl?: string | null
  founding?: boolean
  tradingNow?: boolean
  href?: string
  className?: string
}) {
  const meta = [
    city,
    completedTrades != null ? `${completedTrades} trades` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const inner = (
    <div
      className={cn(
        'border-line hover:shadow-card overflow-hidden rounded-lg border bg-white transition-[transform,box-shadow] hover:-translate-y-[3px]',
        className,
      )}
    >
      <div className="bg-navy relative h-11">
        {founding && (
          <span className="text-brass-bright absolute top-2.5 right-3 font-mono text-[9px] font-semibold tracking-[0.1em]">
            Founding
          </span>
        )}
      </div>
      <div className="px-4 pb-4">
        <Pfp
          src={avatarUrl}
          name={username}
          size={56}
          className="-mt-7 border-4 border-white"
        />
        <div className="font-display mt-1.5 text-[17px] font-bold">
          {username}
        </div>
        {meta && <div className="text-slate mt-0.5 text-xs">{meta}</div>}
        {tradingNow && (
          <div className="text-teal-deep mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold">
            <span className="bg-teal h-2 w-2 rounded-full" />
            Trading now
          </div>
        )}
      </div>
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  )
}
