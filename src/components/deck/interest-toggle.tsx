'use client'

import { useState } from 'react'
import { Globe, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addInterest, removeInterest } from '@/lib/services/deck-interests'

interface InterestToggleProps {
  deckId: string
  userId: string | null
  initialInterested: boolean
  initialCount: number
}

export function InterestToggle({
  deckId,
  userId,
  initialInterested,
  initialCount,
}: InterestToggleProps) {
  const [interested, setInterested] = useState(initialInterested)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (!userId) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }

    setLoading(true)
    const prev = interested
    const prevCount = count

    setInterested(!prev)
    setCount(prev ? prevCount - 1 : prevCount + 1)

    try {
      if (prev) {
        const { error } = await removeInterest(userId, deckId)
        if (error) {
          setInterested(prev)
          setCount(prevCount)
        }
      } else {
        const { error } = await addInterest(userId, deckId)
        if (error) {
          setInterested(prev)
          setCount(prevCount)
        } else {
          fetch('/api/notify/deck-interest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deckId }),
          }).catch(() => {})
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="border-line bg-paper-2 flex items-start gap-2 rounded-md border px-3 py-2.5">
        <Globe className="text-teal-deep mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-ink text-xs font-semibold">Not in your area</p>
          <p className="text-ink-2 mt-0.5 text-[10px]">
            {interested
              ? `${count} trader${count !== 1 ? 's' : ''} want this shipped. We're on it.`
              : "We're working on shipping. Vote to help us launch it faster."}
          </p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-pressed={interested}
        className={cn(
          'font-display flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60',
          interested
            ? 'bg-teal text-paper hover:bg-teal-deep'
            : 'bg-brass text-[#241a08] shadow-[0_3px_0_var(--brass-deep)] hover:-translate-y-px active:translate-y-[3px] active:shadow-none',
        )}
      >
        <Package className="h-4 w-4" />
        <span>{interested ? 'Voted to ship' : 'Want this shipped?'}</span>
        {count > 0 && (
          <span className="font-mono text-sm opacity-70">{count}</span>
        )}
      </button>
    </div>
  )
}
