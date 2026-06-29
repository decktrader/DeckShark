import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PaginationNavProps {
  page: number
  totalPages: number
  buildUrl: (page: number) => string
}

const CELL =
  'grid h-9 min-w-9 place-items-center rounded-md border px-2.5 font-mono text-[13px]'

export function PaginationNav({
  page,
  totalPages,
  buildUrl,
}: PaginationNavProps) {
  if (totalPages <= 1) return null

  // First, last, and a window around the current page; gaps become ellipses.
  const shown: number[] = []
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || (n >= page - 1 && n <= page + 1)) {
      shown.push(n)
    }
  }
  const items: (number | 'gap')[] = []
  let prev = 0
  for (const n of shown) {
    if (n - prev > 1) items.push('gap')
    items.push(n)
    prev = n
  }

  return (
    <div className="mt-[30px] mb-2.5 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={buildUrl(page - 1)}
          className={cn(
            CELL,
            'border-line text-ink-2 hover:border-slate hover:text-ink bg-white',
          )}
        >
          Prev
        </Link>
      ) : (
        <span
          className={cn(CELL, 'border-line text-ink-3 bg-white opacity-50')}
        >
          Prev
        </span>
      )}

      {items.map((it, i) =>
        it === 'gap' ? (
          <span
            key={`gap-${i}`}
            className={cn(CELL, 'text-slate border-transparent')}
          >
            …
          </span>
        ) : (
          <Link
            key={it}
            href={buildUrl(it)}
            aria-current={it === page ? 'page' : undefined}
            className={cn(
              CELL,
              it === page
                ? 'border-navy bg-navy text-paper'
                : 'border-line text-ink-2 hover:border-slate hover:text-ink bg-white',
            )}
          >
            {it}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={buildUrl(page + 1)}
          className={cn(
            CELL,
            'border-line text-ink-2 hover:border-slate hover:text-ink bg-white',
          )}
        >
          Next
        </Link>
      ) : (
        <span
          className={cn(CELL, 'border-line text-ink-3 bg-white opacity-50')}
        >
          Next
        </span>
      )}
    </div>
  )
}
