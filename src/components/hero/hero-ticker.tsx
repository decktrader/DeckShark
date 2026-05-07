'use client'

import type { TickerItem } from '@/lib/services/hero.server'

const ACTION_COLORS: Record<string, string> = {
  traded: '#34d399',
  wants: '#f472b6',
  listed: '#a78bfa',
}

interface HeroTickerProps {
  items: TickerItem[]
}

export function HeroTicker({ items }: HeroTickerProps) {
  if (items.length === 0) return null

  // Triple the items so the marquee can loop seamlessly
  const tripled = [...items, ...items, ...items]

  return (
    <div
      className="relative overflow-hidden border-y border-white/[0.06]"
      style={{
        background: 'rgba(0,0,0,0.25)',
        maskImage:
          'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
      }}
    >
      <div className="animate-ticker flex w-max gap-12 py-3 whitespace-nowrap">
        {tripled.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-[13px] text-white/65"
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background: ACTION_COLORS[t.action] ?? '#a78bfa',
                boxShadow: `0 0 8px ${ACTION_COLORS[t.action] ?? '#a78bfa'}`,
              }}
            />
            <span className="font-semibold text-white/90">{t.who}</span>
            <span className="text-white/40">in</span>
            <span className="text-violet-300/85">{t.city}</span>
            <span className="text-white/40">{t.action}</span>
            <span className="font-medium text-white">{t.what}</span>
            <span className="text-[11px] text-white/35">{t.when}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
