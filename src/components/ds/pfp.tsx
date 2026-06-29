import { cn } from '@/lib/utils'

/** Profile-picture palette, cycled by username. Matches the mock's PALS. */
const PALS = ['#B45F42', '#3D7A75', '#C19458', '#5B6675', '#18222D']

function palFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALS[h % PALS.length]
}

/**
 * Pfp — the standard way to show a person. Always circular, never distorts.
 * Renders the avatar image when present; otherwise a palette-cycled fallback
 * showing a silhouette (default) or the first initial. Usernames are shown
 * elsewhere WITHOUT an @ prefix.
 */
export function Pfp({
  src,
  name = '',
  size = 30,
  initials = false,
  className,
}: {
  src?: string | null
  name?: string
  size?: number
  /** Use the first initial instead of the silhouette fallback. */
  initials?: boolean
  className?: string
}) {
  const dim = { width: size, height: size }

  if (src) {
    return (
      <span
        className={cn(
          'bg-paper-3 inline-grid shrink-0 place-items-center overflow-hidden rounded-full',
          className,
        )}
        style={dim}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar urls are arbitrary external hosts */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    )
  }

  const bg = palFor(name || '?')

  if (initials && name) {
    return (
      <span
        className={cn(
          'font-display text-paper inline-grid shrink-0 place-items-center rounded-full font-bold',
          className,
        )}
        style={{
          ...dim,
          backgroundColor: bg,
          fontSize: Math.round(size * 0.4),
        }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full',
        className,
      )}
      style={{ ...dim, backgroundColor: bg }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-paper/90"
        style={{ width: '58%', height: '58%' }}
        aria-hidden="true"
      >
        <circle cx="12" cy="8.5" r="4" />
        <path d="M4.5 20c0-4.2 3.8-6.5 7.5-6.5s7.5 2.3 7.5 6.5z" />
      </svg>
    </span>
  )
}
