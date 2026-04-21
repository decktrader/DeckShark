'use client'

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

  return (
    <div className="flex items-center gap-1.5 text-[13px]">
      <span className="text-muted-foreground mr-0.5">Sort by:</span>
      {SORT_OPTIONS.map((opt, i) => (
        <span key={opt.value} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-white/[0.12] select-none">|</span>}
          <button
            onClick={() => setSort(opt.value)}
            className={cn(
              'cursor-pointer border-b-[1.5px] border-transparent pb-px transition-colors',
              currentSort === opt.value
                ? 'text-foreground border-b-primary font-semibold'
                : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  )
}
