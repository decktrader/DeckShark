'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { addInterest, removeInterest } from '@/lib/services/deck-interests'

interface InterestToggleMobileProps {
  deckId: string
  userId: string | null
  initialInterested: boolean
  initialCount: number
}

export function InterestToggleMobile({
  deckId,
  userId,
  initialInterested,
  initialCount,
}: InterestToggleMobileProps) {
  const [interested, setInterested] = useState(initialInterested)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (!userId) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }

    setLoading(true)
    const prev = interested

    setInterested(!prev)

    try {
      if (prev) {
        const { error } = await removeInterest(userId, deckId)
        if (error) setInterested(prev)
      } else {
        const { error } = await addInterest(userId, deckId)
        if (error) {
          setInterested(prev)
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
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={loading}
      className="mt-2 w-full border-violet-500/30 text-violet-300"
    >
      {interested ? 'Voted to ship!' : 'Want this shipped?'}
    </Button>
  )
}
