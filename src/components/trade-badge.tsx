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
      className="text-muted-foreground hover:bg-accent relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
    >
      Trades
      {count > 0 && (
        <span className="bg-primary flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
