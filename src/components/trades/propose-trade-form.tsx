'use client'

import { useState, useMemo } from 'react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  const [cashManuallyEdited, setCashManuallyEdited] = useState(false)
  const [iPayCash, setIPayCash] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-calculate cash difference from deck values
  const myTotalCents = useMemo(() => {
    return myDecks
      .filter((d) => selectedDeckIds.has(d.id))
      .reduce((sum, d) => sum + (d.estimated_value_cents ?? 0), 0)
  }, [selectedDeckIds, myDecks])

  const theirTotalCents = targetDeck.estimated_value_cents ?? 0
  const diffCents = theirTotalCents - myTotalCents

  // Auto-set cash when selection changes (unless manually edited)
  function toggleDeck(id: string) {
    setSelectedDeckIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    if (!cashManuallyEdited) {
      // Recalculate after toggle — need to compute with the new set
      const nextSelected = new Set(selectedDeckIds)
      if (nextSelected.has(id)) nextSelected.delete(id)
      else nextSelected.add(id)
      const nextMyTotal = myDecks
        .filter((d) => nextSelected.has(d.id))
        .reduce((sum, d) => sum + (d.estimated_value_cents ?? 0), 0)
      const nextDiff = theirTotalCents - nextMyTotal
      if (nextDiff > 0) {
        setCashDollars((nextDiff / 100).toFixed(2))
        setIPayCash(true)
      } else if (nextDiff < 0) {
        setCashDollars((Math.abs(nextDiff) / 100).toFixed(2))
        setIPayCash(false)
      } else {
        setCashDollars('')
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const rawCentsCheck = cashDollars
      ? Math.round(parseFloat(cashDollars) * 100)
      : 0
    if (selectedDeckIds.size === 0 && rawCentsCheck === 0) {
      setError('Offer at least one deck or a cash amount.')
      return
    }

    setLoading(true)
    setError(null)

    const rawCents = cashDollars ? Math.round(parseFloat(cashDollars) * 100) : 0
    // Positive = proposer (you) pays, negative = receiver (they) pay
    const cashCents = iPayCash ? rawCents : -rawCents

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

    // Await notification before navigating so the request isn't aborted
    await fetch('/api/notify/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId: data.id, event: 'proposed' }),
    }).catch(() => {})

    router.push('/trades')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: target deck */}
        <div>
          <Card className="overflow-hidden">
            {targetDeck.commander_scryfall_id && (
              <img
                src={scryfallArtUrl(targetDeck.commander_scryfall_id)}
                alt={targetDeck.commander_name ?? ''}
                className="h-40 w-full object-cover"
              />
            )}
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                You want
              </p>
              <h2 className="mt-1 text-lg font-bold">{targetDeck.name}</h2>
              {targetDeck.commander_name && (
                <p className="text-muted-foreground text-sm">
                  {[
                    targetDeck.commander_name,
                    targetDeck.partner_commander_name,
                  ]
                    .filter(Boolean)
                    .join(' / ')}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  by {targetDeck.owner.username}
                  {targetDeck.owner.city &&
                    ` · ${targetDeck.owner.city}, ${targetDeck.owner.province}`}
                </p>
                <p className="text-primary font-bold">
                  {formatPrice(targetDeck.estimated_value_cents)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: your offer */}
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
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
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selectedDeckIds.has(deck.id)
                      ? 'border-primary/50 bg-primary/5'
                      : 'hover:bg-accent/30'
                  }`}
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

          {/* Value summary */}
          {selectedDeckIds.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[2%] px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Your offer: {formatPrice(myTotalCents)}
              </span>
              <span className="text-muted-foreground">
                Their deck: {formatPrice(theirTotalCents)}
              </span>
              {diffCents !== 0 && (
                <span
                  className={
                    diffCents > 0 ? 'text-yellow-400' : 'text-green-400'
                  }
                >
                  {diffCents > 0 ? 'You owe' : 'They owe'}{' '}
                  {formatPrice(Math.abs(diffCents))}
                </span>
              )}
            </div>
          )}

          <Separator />

          {/* Cash difference */}
          <div className="space-y-3">
            <Label>Cash difference</Label>
            <div className="flex items-center gap-3">
              <div className="relative w-36">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0.00"
                  className="pl-7"
                  value={cashDollars}
                  onChange={(e) => {
                    setCashDollars(e.target.value)
                    setCashManuallyEdited(true)
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setIPayCash(!iPayCash)}
                className="bg-muted relative inline-flex h-9 w-[180px] shrink-0 items-center rounded-full border p-1 transition-colors"
                aria-label={iPayCash ? 'You pay cash' : 'They pay cash'}
              >
                <span
                  className={`bg-primary absolute h-7 w-[84px] rounded-full shadow-sm transition-all duration-200 ${
                    iPayCash ? 'translate-x-[88px]' : 'translate-x-0'
                  }`}
                />
                <span
                  className={`relative z-10 w-[88px] text-center text-xs font-semibold transition-colors ${
                    !iPayCash ? 'text-white' : 'text-muted-foreground'
                  }`}
                >
                  They pay
                </span>
                <span
                  className={`relative z-10 w-[88px] text-center text-xs font-semibold transition-colors ${
                    iPayCash ? 'text-white' : 'text-muted-foreground'
                  }`}
                >
                  You pay
                </span>
              </button>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="text-muted-foreground hover:text-foreground border-muted-foreground/40 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors"
                      tabIndex={0}
                      aria-label="Cash difference info"
                    >
                      i
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    <p>
                      Auto-calculated from deck values. Adjust manually if
                      needed.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {!cashManuallyEdited &&
              selectedDeckIds.size > 0 &&
              diffCents !== 0 && (
                <p className="text-muted-foreground text-xs">
                  Auto-calculated from the value difference.
                </p>
              )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself, mention card conditions, suggest a meetup location…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Sending proposal…' : 'Send trade proposal'}
          </Button>
        </div>
      </div>
    </form>
  )
}
