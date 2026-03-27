'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { proposeTrade } from '@/lib/services/trades'
import type { Deck } from '@/types'
import type { PublicDeck } from '@/lib/services/decks.server'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

function scryfallArtUrl(scryfallId: string): string {
  return `https://cards.scryfall.io/art_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
}

export function ProposeTradeForm({
  targetDeck,
  myDecks,
  userId,
}: {
  targetDeck: PublicDeck
  myDecks: Deck[]
  userId: string
}) {
  const router = useRouter()
  const [selectedDeckIds, setSelectedDeckIds] = useState<Set<string>>(new Set())
  const [cashDollars, setCashDollars] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDeck(id: string) {
    setSelectedDeckIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedDeckIds.size === 0) {
      setError('Select at least one of your decks to offer.')
      return
    }

    setLoading(true)
    setError(null)

    const cashCents = cashDollars
      ? Math.round(parseFloat(cashDollars) * 100)
      : 0

    const { data, error: err } = await proposeTrade(
      userId,
      targetDeck.user_id,
      [...selectedDeckIds],
      [targetDeck.id],
      cashCents,
      message || undefined,
    )

    if (err || !data) {
      setError(err ?? 'Failed to propose trade.')
      setLoading(false)
      return
    }

    // Fire-and-forget notification to the receiver
    fetch('/api/notify/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId: data.id, event: 'proposed' }),
    }).catch(() => {})

    router.push(`/trades/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Target deck summary */}
      <div>
        <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
          You&apos;re proposing to trade for
        </h2>
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            {targetDeck.commander_scryfall_id && (
              <img
                src={scryfallArtUrl(targetDeck.commander_scryfall_id)}
                alt={targetDeck.commander_name ?? ''}
                className="h-16 w-24 rounded-md object-cover"
              />
            )}
            <div>
              <p className="font-semibold">{targetDeck.name}</p>
              <p className="text-muted-foreground text-sm">
                by {targetDeck.owner.username}
                {targetDeck.owner.city &&
                  ` · ${targetDeck.owner.city}, ${targetDeck.owner.province}`}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatPrice(targetDeck.estimated_value_cents)}
                {targetDeck.commander_name && ` · ${targetDeck.commander_name}`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Your decks to offer */}
      <div>
        <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
          Select decks to offer
        </h2>
        {myDecks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You have no decks marked as available for trade. Go to your{' '}
            <a href="/dashboard" className="underline">
              dashboard
            </a>{' '}
            and toggle a deck as available.
          </p>
        ) : (
          <div className="space-y-2">
            {myDecks.map((deck) => (
              <label
                key={deck.id}
                className="hover:bg-accent/30 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <Checkbox
                  checked={selectedDeckIds.has(deck.id)}
                  onCheckedChange={() => toggleDeck(deck.id)}
                />
                {deck.commander_scryfall_id && (
                  <img
                    src={scryfallArtUrl(deck.commander_scryfall_id)}
                    alt={deck.commander_name ?? ''}
                    className="h-10 w-14 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{deck.name}</p>
                  <p className="text-muted-foreground text-xs capitalize">
                    {deck.format}
                    {deck.commander_name && ` · ${deck.commander_name}`}
                    {deck.estimated_value_cents
                      ? ` · ${formatPrice(deck.estimated_value_cents)}`
                      : ''}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Cash difference */}
      <div className="space-y-2">
        <Label htmlFor="cash">Cash difference (optional)</Label>
        <p className="text-muted-foreground text-xs">
          Positive amount means you&apos;ll pay the difference to sweeten the
          deal.
        </p>
        <div className="relative w-40">
          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            $
          </span>
          <Input
            id="cash"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="pl-7"
            value={cashDollars}
            onChange={(e) => setCashDollars(e.target.value)}
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          placeholder="Introduce yourself, mention card conditions, suggest a meetup location…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
      </div>

      <Button
        type="submit"
        disabled={loading || selectedDeckIds.size === 0}
        className="w-full"
      >
        {loading ? 'Sending proposal…' : 'Send trade proposal'}
      </Button>
    </form>
  )
}
