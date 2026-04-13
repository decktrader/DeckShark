'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { counterTrade } from '@/lib/services/trades'
import type { Deck, Trade } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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

interface CounterOfferFormProps {
  trade: Trade
  userId: string
  theirUserId: string
  myDecks: Deck[]
  theirDecks: Deck[]
  currentMyDeckIds: string[]
  currentTheirDeckIds: string[]
  onCancel: () => void
}

export function CounterOfferForm({
  trade,
  userId,
  theirUserId,
  myDecks,
  theirDecks,
  currentMyDeckIds,
  currentTheirDeckIds,
  onCancel,
}: CounterOfferFormProps) {
  const router = useRouter()
  const [selectedMyDeckIds, setSelectedMyDeckIds] = useState<Set<string>>(
    new Set(currentMyDeckIds),
  )
  const [selectedTheirDeckIds, setSelectedTheirDeckIds] = useState<Set<string>>(
    new Set(currentTheirDeckIds),
  )
  const [cashDollars, setCashDollars] = useState(
    trade.cash_difference_cents
      ? Math.abs(trade.cash_difference_cents / 100).toFixed(2)
      : '',
  )
  const [iPayCash, setIPayCash] = useState(trade.cash_difference_cents > 0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleMyDeck(id: string) {
    setSelectedMyDeckIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTheirDeck(id: string) {
    setSelectedTheirDeckIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (selectedMyDeckIds.size === 0 && selectedTheirDeckIds.size === 0) {
      setError('Select at least one deck on each side.')
      return
    }
    if (selectedMyDeckIds.size === 0) {
      setError('Select at least one of your decks to offer.')
      return
    }
    if (selectedTheirDeckIds.size === 0) {
      setError("Select at least one of their decks you'd like.")
      return
    }

    setLoading(true)
    setError(null)

    const rawCents = cashDollars ? Math.round(parseFloat(cashDollars) * 100) : 0
    // Positive = proposer pays. If I'm countering and I say "I pay", sign depends
    // on whether I'm the original proposer or receiver.
    // Simplify: positive = the counter-er pays, negative = they pay.
    // But the DB convention is positive = proposer pays.
    // So: if I'm the proposer and I pay → positive. If I'm the receiver and I pay → negative.
    const isProposer = userId === trade.proposer_id
    let cashCents = rawCents
    if (iPayCash) {
      cashCents = isProposer ? rawCents : -rawCents
    } else {
      cashCents = isProposer ? -rawCents : rawCents
    }

    const { error: err } = await counterTrade(
      trade.id,
      userId,
      [...selectedMyDeckIds],
      [...selectedTheirDeckIds],
      theirUserId,
      cashCents,
      message || undefined,
    )

    if (err) {
      setError(err)
      setLoading(false)
      return
    }

    // Notify the other party
    fetch('/api/notify/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId: trade.id, event: 'countered' }),
    }).catch(() => {})

    router.push('/trades')
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold">Counter-offer</h3>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* My decks to offer */}
      <div>
        <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          Your decks to offer
        </h4>
        {myDecks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You have no decks available for trade.
          </p>
        ) : (
          <div className="space-y-2">
            {myDecks.map((deck) => (
              <label
                key={deck.id}
                className="hover:bg-accent/30 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <Checkbox
                  checked={selectedMyDeckIds.has(deck.id)}
                  onCheckedChange={() => toggleMyDeck(deck.id)}
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

      {/* Their decks to request */}
      <div>
        <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          Decks you&apos;d like from them
        </h4>
        {theirDecks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            They have no decks available for trade.
          </p>
        ) : (
          <div className="space-y-2">
            {theirDecks.map((deck) => (
              <label
                key={deck.id}
                className="hover:bg-accent/30 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <Checkbox
                  checked={selectedTheirDeckIds.has(deck.id)}
                  onCheckedChange={() => toggleTheirDeck(deck.id)}
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
      <div className="space-y-3">
        <Label>Cash difference (optional)</Label>
        <div className="flex items-center gap-3">
          <div className="relative w-36">
            <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
              $
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="pl-7"
              value={cashDollars}
              onChange={(e) => setCashDollars(e.target.value)}
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
                  Add extra cash to balance the trade. <strong>They pay</strong>{' '}
                  means the other trader adds cash. <strong>You pay</strong>{' '}
                  means you add cash. Click to toggle.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="counter-message">Message (optional)</Label>
        <Textarea
          id="counter-message"
          placeholder="Explain your counter-offer…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Sending counter…' : 'Send counter-offer'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
