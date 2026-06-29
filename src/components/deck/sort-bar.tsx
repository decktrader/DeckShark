'use client'

import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { SORT_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SortBarProps {
  basePath?: string
}

export function SortBar({ basePath }: SortBarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const currentSort = searchParams.get('sortBy') ?? 'recent'
  const resolvedPath = basePath ?? pathname
  const isList = searchParams.get('view') === 'list'

  const setSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'recent') {
        params.delete('sortBy')
      } else {
        params.set('sortBy', value)
      }
      params.delete('page')
      const qs = params.toString()
      router.replace(qs ? `${resolvedPath}?${qs}` : resolvedPath)
    },
    [searchParams, router, resolvedPath],
  )

  function viewUrl(list: boolean): string {
    const params = new URLSearchParams(searchParams.toString())
    if (list) params.set('view', 'list')
    else params.delete('view')
    const qs = params.toString()
    return qs ? `${resolvedPath}?${qs}` : resolvedPath
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="border-line inline-flex gap-0.5 rounded-md border bg-white p-[3px]">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={cn(
              'rounded-[3px] px-[11px] py-1.5 text-[12.5px] font-semibold transition-colors',
              currentSort === opt.value
                ? 'bg-navy text-paper'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid / list view toggle (desktop) */}
      <div className="border-line ml-auto hidden gap-0.5 rounded-md border bg-white p-[3px] lg:inline-flex">
        <Link
          href={viewUrl(false)}
          aria-label="Grid view"
          className={cn(
            'grid h-7 w-8 place-items-center rounded-[3px]',
            !isList ? 'bg-paper-2 text-ink' : 'text-ink-2 hover:text-ink',
          )}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="8" height="8" rx="1" />
            <rect x="13" y="3" width="8" height="8" rx="1" />
            <rect x="3" y="13" width="8" height="8" rx="1" />
            <rect x="13" y="13" width="8" height="8" rx="1" />
          </svg>
        </Link>
        <Link
          href={viewUrl(true)}
          aria-label="List view"
          className={cn(
            'grid h-7 w-8 place-items-center rounded-[3px]',
            isList ? 'bg-paper-2 text-ink' : 'text-ink-2 hover:text-ink',
          )}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="4" width="18" height="3" rx="1" />
            <rect x="3" y="10.5" width="18" height="3" rx="1" />
            <rect x="3" y="17" width="18" height="3" rx="1" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
