import type { TickerItem } from '@/lib/services/hero.server'

const VERB_COLOR: Record<TickerItem['action'], string> = {
  wants: 'text-terra-bright',
  listed: 'text-teal-bright',
  traded: 'text-brass-bright',
}
const VERB_LABEL: Record<TickerItem['action'], string> = {
  wants: 'wants',
  listed: 'listed',
  traded: 'traded',
}

/**
 * Announce strip with the scrolling "New in The Harbour" ticker. Pure CSS
 * scroll (reuses .animate-ticker); content is tripled for a seamless loop.
 */
export function LiveTicker({
  items,
  liveCount,
  cityCount,
}: {
  items: TickerItem[]
  liveCount: number
  cityCount: number
}) {
  if (!items.length) return null
  const loop = [...items, ...items, ...items]

  return (
    <div className="border-line-navy bg-navy text-paper border-b">
      <div className="mx-auto flex h-[38px] max-w-[1280px] items-center gap-[18px] px-[30px]">
        <span className="text-terra-bright flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
          <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
          New in The Harbour
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_2.5%,#000_95%,transparent)]">
          <div className="animate-ticker inline-flex whitespace-nowrap will-change-transform hover:[animation-play-state:paused]">
            {loop.map((it, i) => (
              <span
                key={i}
                className="border-line-navy text-paper/[0.66] inline-flex items-center gap-2 border-r px-[15px] font-mono text-[11px]"
              >
                <b className="text-paper font-semibold">{it.who}</b>
                <span className={`font-semibold ${VERB_COLOR[it.action]}`}>
                  {VERB_LABEL[it.action]}
                </span>
                {it.what} · {it.city}
              </span>
            ))}
          </div>
        </div>
        <span className="text-paper/75 hidden shrink-0 font-mono text-[11px] whitespace-nowrap sm:inline">
          <b className="text-brass font-semibold">{liveCount}</b> trading now ·{' '}
          <b className="text-brass font-semibold">{cityCount}</b> cities
        </span>
      </div>
    </div>
  )
}
