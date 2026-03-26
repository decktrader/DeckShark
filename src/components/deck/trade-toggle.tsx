'use client'

import { useState, useTransition } from 'react'
import { updateDeck } from '@/lib/services/decks'

export function TradeToggle({
  deckId,
  initialValue,
}: {
  deckId: string
  initialValue: boolean
}) {
  const [available, setAvailable] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !available
    setAvailable(next)
    startTransition(async () => {
      const { error } = await updateDeck(deckId, { available_for_trade: next })
      if (error) setAvailable(!next) // revert on failure
    })
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        toggle()
      }}
      disabled={isPending}
      className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
        available
          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {available ? 'For trade' : 'Not listed'}
    </button>
  )
}
