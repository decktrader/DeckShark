'use client'

import { useState, useTransition } from 'react'
import { updateDeck } from '@/lib/services/decks'
import { Switch } from '@/components/ui/switch'

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
      if (error) {
        setAvailable(!next) // revert on failure
      } else if (next) {
        // Deck just listed — check for want list matches
        fetch('/api/notify/want-list-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckId }),
        }).catch(() => {})
      }
    })
  }

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <span
        className={`text-xs ${available ? 'text-emerald-400' : 'text-muted-foreground'}`}
      >
        {available ? 'Trading' : 'Private'}
      </span>
      <Switch
        checked={available}
        onCheckedChange={() => toggle()}
        disabled={isPending}
        className="scale-75"
      />
    </div>
  )
}
