import Link from 'next/link'
import { cn } from '@/lib/utils'

/** The DeckShark shark-fin mark: terracotta fin over a teal wake. */
export function SharkFin({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      className={cn('shrink-0', className)}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 25 C13 24 20 19 26 5 C26 16 24 22 28 25 Z" fill="#B45F42" />
      <path
        d="M3 26 C12 28 22 28 30 26 L30 28 C22 30 11 30 3 28 Z"
        fill="#3D7A75"
      />
    </svg>
  )
}

/** Logo lockup: fin + "DeckShark" wordmark (terracotta "Shark"). */
export function Brand({
  href = '/',
  className,
  wordmarkClassName = 'text-[20px] text-ink',
}: {
  href?: string
  className?: string
  wordmarkClassName?: string
}) {
  return (
    <Link
      href={href}
      className={cn('flex shrink-0 items-center gap-2.5', className)}
      aria-label="DeckShark home"
    >
      <SharkFin />
      <span
        className={cn(
          'font-display font-bold tracking-[-0.01em]',
          wordmarkClassName,
        )}
      >
        Deck<span className="text-terra">Shark</span>
      </span>
    </Link>
  )
}
