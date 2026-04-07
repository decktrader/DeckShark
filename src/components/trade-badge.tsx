'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function TradeBadge() {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { count: proposedCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'proposed')

    const { count: counterCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'countered')
      .neq('last_counter_by', user.id)
      .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)

    setCount((proposedCount ?? 0) + (counterCount ?? 0))
  }, [])

  useEffect(() => {
    const onFocus = () => {
      void fetchCount()
    }
    window.addEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch on mount is intentional
    void fetchCount()
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchCount])

  return (
    <Link
      href="/trades"
      className="text-muted-foreground hover:text-foreground relative p-2 transition-colors"
      aria-label={`Notifications${count > 0 ? ` (${count})` : ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 && (
        <span className="bg-primary absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
