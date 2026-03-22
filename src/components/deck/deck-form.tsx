'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createDeck,
  addDeckCards,
  calculateDeckValue,
} from '@/lib/services/decks'
import { searchCards } from '@/lib/services/cards'
import { parseDecklist } from '@/lib/importers/text'
import { FORMATS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function DeckForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [format, setFormat] = useState('commander')
  const [description, setDescription] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [decklistText, setDecklistText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setParseErrors([])
    setLoading(true)

    // Parse the decklist
    const { cards: parsedCards, errors } = parseDecklist(decklistText)
    if (parsedCards.length === 0) {
      setError('No cards found in the decklist.')
      setLoading(false)
      return
    }
    if (errors.length > 0) {
      setParseErrors(errors)
    }

    // Find the commander if any
    const commander = parsedCards.find((c) => c.isCommander)

    // Create the deck
    const { data: deck, error: deckError } = await createDeck(userId, {
      name,
      format,
      description: description || undefined,
      condition_notes: conditionNotes || undefined,
      commander_name: commander?.name,
    })

    if (deckError || !deck) {
      setError(deckError ?? 'Failed to create deck.')
      setLoading(false)
      return
    }

    // Resolve card names to scryfall IDs and prices
    const resolvedCards = await Promise.all(
      parsedCards.map(async (parsed) => {
        const { data: matches } = await searchCards(parsed.name, 1)
        const match = matches?.find(
          (m) => m.name.toLowerCase() === parsed.name.toLowerCase(),
        )
        return {
          card_name: match?.name ?? parsed.name,
          scryfall_id: match?.scryfall_id,
          quantity: parsed.quantity,
          is_commander: parsed.isCommander,
          price_cents: match?.price_usd_cents ?? undefined,
        }
      }),
    )

    // If commander was found in card cache, update deck with scryfall ID
    if (commander) {
      const commanderCard = resolvedCards.find((c) => c.is_commander)
      if (commanderCard?.scryfall_id) {
        const { updateDeck } = await import('@/lib/services/decks')
        await updateDeck(deck.id, {
          commander_scryfall_id: commanderCard.scryfall_id,
        })
      }
    }

    // Add cards to deck
    const { error: cardsError } = await addDeckCards(deck.id, resolvedCards)
    if (cardsError) {
      setError(cardsError)
      setLoading(false)
      return
    }

    // Calculate deck value
    await calculateDeckValue(deck.id)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a new deck</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="name">Deck name</Label>
            <Input
              id="name"
              placeholder="e.g. Atraxa Superfriends"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of your deck"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition notes (optional)</Label>
            <Input
              id="condition"
              placeholder="e.g. NM/LP, some cards are proxied"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="decklist">Decklist</Label>
            <textarea
              id="decklist"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[200px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={`Paste your decklist here, e.g.:\n\nCOMMANDER: Atraxa, Praetors' Voice\n1x Sol Ring\n1x Arcane Signet\n4x Lightning Bolt`}
              value={decklistText}
              onChange={(e) => setDecklistText(e.target.value)}
              required
            />
          </div>
          {parseErrors.length > 0 && (
            <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm">
              <p className="font-medium text-yellow-800">
                Some lines could not be parsed:
              </p>
              <ul className="mt-1 list-inside list-disc text-yellow-700">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || !name || !decklistText}>
            {loading ? 'Creating deck...' : 'Create deck'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
