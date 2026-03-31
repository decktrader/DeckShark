'use client'

import { cn } from '@/lib/utils'
import { MTG_COLORS } from '@/lib/constants'

// Per-color styles: unselected and selected states
const COLOR_STYLES: Record<
  string,
  { base: string; selected: string; label: string }
> = {
  W: {
    base: 'bg-amber-50 text-amber-700 ring-amber-300 hover:bg-amber-100',
    selected: 'bg-amber-200 text-amber-900 ring-amber-500 scale-110',
    label: 'White',
  },
  U: {
    base: 'bg-blue-50 text-blue-700 ring-blue-300 hover:bg-blue-100',
    selected: 'bg-blue-200 text-blue-900 ring-blue-500 scale-110',
    label: 'Blue',
  },
  B: {
    base: 'bg-zinc-700 text-zinc-100 ring-zinc-500 hover:bg-zinc-600',
    selected: 'bg-zinc-900 text-white ring-zinc-300 scale-110',
    label: 'Black',
  },
  R: {
    base: 'bg-red-50 text-red-700 ring-red-300 hover:bg-red-100',
    selected: 'bg-red-200 text-red-900 ring-red-500 scale-110',
    label: 'Red',
  },
  G: {
    base: 'bg-green-50 text-green-700 ring-green-300 hover:bg-green-100',
    selected: 'bg-green-200 text-green-900 ring-green-500 scale-110',
    label: 'Green',
  },
}

interface ColorIdentitySelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function ColorIdentitySelector({
  value,
  onChange,
}: ColorIdentitySelectorProps) {
  function toggle(color: string) {
    onChange(
      value.includes(color)
        ? value.filter((c) => c !== color)
        : [...value, color],
    )
  }

  return (
    <div className="flex gap-1.5" role="group" aria-label="Color identity">
      {MTG_COLORS.map(({ value: colorVal }) => {
        const selected = value.includes(colorVal)
        const styles = COLOR_STYLES[colorVal]
        return (
          <button
            key={colorVal}
            type="button"
            aria-pressed={selected}
            aria-label={styles.label}
            onClick={() => toggle(colorVal)}
            className={cn(
              'h-8 w-8 rounded-full text-xs font-bold ring-2 transition-all focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:outline-none',
              styles.base,
              selected && styles.selected,
            )}
          >
            {colorVal}
          </button>
        )
      })}
    </div>
  )
}
