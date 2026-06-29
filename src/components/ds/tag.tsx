import { cn } from '@/lib/utils'

type TagVariant = 'terra' | 'teal' | 'brass' | 'slate'

const TAG_VARIANTS: Record<TagVariant, string> = {
  terra: 'bg-terra/15 text-terra-deep',
  teal: 'bg-teal/15 text-teal-deep',
  brass: 'bg-brass/20 text-brass-deep',
  slate: 'bg-paper-3 text-slate',
}

/**
 * Tag — a status/category pill. terra = wanted/demand/hot, teal = listed/
 * supply/go, brass = featured, slate = neutral. Never red/green.
 */
export function Tag({
  variant = 'slate',
  className,
  children,
}: {
  variant?: TagVariant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'rounded-pill inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-bold',
        TAG_VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Status dot (nav-light). terra = wanted/live, teal = listed/go. */
export function NavLight({
  tone,
  className,
}: {
  tone: 'terra' | 'teal'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        tone === 'terra' ? 'bg-terra' : 'bg-teal',
        className,
      )}
    />
  )
}
