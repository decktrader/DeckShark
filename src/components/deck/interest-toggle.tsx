'use client'

import { useState } from 'react'
import { Globe, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[2%] px-3 py-2.5">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
        <div>
          <p className="text-xs font-medium">Not in your area</p>
          <p className="text-muted-foreground mt-0.5 text-[10px]">
            {interested
              ? `${count} trader${count !== 1 ? 's' : ''} want this shipped. We're on it!`
              : "We're working on shipping. Vote to help us launch it faster!"}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className="w-full gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
      >
        <Package className="h-4 w-4" />
        <span>{interested ? 'Voted to ship ✓' : 'Want this shipped?'}</span>
        {count > 0 && (
          <span className="ml-1 rounded-full bg-violet-800/60 px-1.5 py-0.5 text-xs font-medium text-violet-200">
            {count}
          </span>
        )}
      </Button>
    </div>
  )
}
