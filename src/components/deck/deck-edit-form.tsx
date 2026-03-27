'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateDeck,
  deleteDeck,
  addDeckCards,
  deleteDeckCard,
  clearDeckCards,
  calculateDeckValue,
} from '@/lib/services/decks'
import { searchCards } from '@/lib/services/cards'
import { parseDecklist } from '@/lib/importers/text'
import {
  uploadDeckPhoto,
  deleteDeckPhoto as deletePhoto,
} from '@/lib/services/storage'
import {
  addDeckPhoto,
  deleteDeckPhoto as deletePhotoRecord,
} from '@/lib/services/decks'
import { getDeckPhotoUrl } from '@/lib/services/storage'
import { FORMATS } from '@/lib/constants'
import type { Deck, DeckCard, DeckPhoto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DeckCardList } from '@/components/deck/deck-card-list'
import { DeckStats } from '@/components/deck/deck-stats'
import { CardAutocomplete } from '@/components/deck/card-autocomplete'

export function DeckEditForm({
  deck: initialDeck,
  cards: initialCards,
  photos: initialPhotos,
  userId,
}: {
  deck: Deck
  cards: DeckCard[]
  photos: DeckPhoto[]
  userId: string
}) {
  const router = useRouter()
  const [deck, setDeck] = useState(initialDeck)
  const [cards, setCards] = useState(initialCards)
  const [photos, setPhotos] = useState(initialPhotos)
  const [name, setName] = useState(deck.name)
  const [format, setFormat] = useState(deck.format)
  const [description, setDescription] = useState(deck.description ?? '')
  const [conditionNotes, setConditionNotes] = useState(
    deck.condition_notes ?? '',
  )
  const [importText, setImportText] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data, error: err } = await updateDeck(deck.id, {
      name,
      format,
      description: description || null,
      condition_notes: conditionNotes || null,
    })

    if (err) {
      setError(err)
    } else if (data) {
      setDeck(data)
    }
    setSaving(false)
  }

  async function handleAddCard(card: {
    scryfall_id: string
    name: string
    price_usd_cents: number | null
  }) {
    const { data } = await addDeckCards(deck.id, [
      {
        card_name: card.name,
        scryfall_id: card.scryfall_id,
        quantity: 1,
        is_commander: false,
        price_cents: card.price_usd_cents ?? undefined,
      },
    ])
    if (data) {
      setCards((prev) => [...prev, ...data])
      await calculateDeckValue(deck.id)
      // Refresh deck to get updated value
      const { getDeck } = await import('@/lib/services/decks')
      const { data: updated } = await getDeck(deck.id)
      if (updated) setDeck(updated)
    }
  }

  async function handleRemoveCard(cardId: string) {
    await deleteDeckCard(cardId)
    setCards((prev) => prev.filter((c) => c.id !== cardId))
    await calculateDeckValue(deck.id)
    const { getDeck } = await import('@/lib/services/decks')
    const { data: updated } = await getDeck(deck.id)
    if (updated) setDeck(updated)
  }

  async function handleFetchUrl() {
    if (!importUrl.trim()) return
    setFetchingUrl(true)
    setError(null)

    const res = await fetch('/api/import/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: importUrl.trim() }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to import from URL.')
      setFetchingUrl(false)
      return
    }

    if (data.cards?.length > 0) {
      const lines = data.cards.map(
        (c: { name: string; quantity: number; isCommander: boolean }) =>
          c.isCommander ? `COMMANDER: ${c.name}` : `${c.quantity}x ${c.name}`,
      )
      setImportText(lines.join('\n'))
      setImportUrl('')
    } else {
      setError('No cards found at that URL.')
    }
    setFetchingUrl(false)
  }

  async function handleImport() {
    if (!importText.trim()) return
    setError(null)

    const { cards: parsedCards } = parseDecklist(importText)
    if (parsedCards.length === 0) {
      setError('No cards found in the import text.')
      return
    }

    // Clear existing cards
    await clearDeckCards(deck.id)

    // Resolve and add
    const resolved = await Promise.all(
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

    const { data: newCards } = await addDeckCards(deck.id, resolved)
    if (newCards) setCards(newCards)

    // Update commander
    const commander = resolved.find((c) => c.is_commander)
    if (commander) {
      await updateDeck(deck.id, {
        commander_name: commander.card_name,
        commander_scryfall_id: commander.scryfall_id ?? null,
      })
    }

    await calculateDeckValue(deck.id)
    const { getDeck } = await import('@/lib/services/decks')
    const { data: updated } = await getDeck(deck.id)
    if (updated) setDeck(updated)

    setImportText('')
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const { data: path, error: uploadErr } = await uploadDeckPhoto(
      userId,
      deck.id,
      file,
    )
    if (uploadErr || !path) {
      setError(uploadErr ?? 'Upload failed')
      setUploading(false)
      return
    }

    const isPrimary = photos.length === 0
    const { data: photo } = await addDeckPhoto(deck.id, path, isPrimary)
    if (photo) setPhotos((prev) => [...prev, photo])
    setUploading(false)
    e.target.value = ''
  }

  async function handleDeletePhoto(photo: DeckPhoto) {
    await deletePhoto(photo.storage_path)
    await deletePhotoRecord(photo.id)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  async function handleDeleteDeck() {
    if (!confirm('Are you sure you want to delete this deck?')) return
    await deleteDeck(deck.id)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <DeckStats deck={deck} cards={cards} />

      <Separator />

      {/* Deck details */}
      <Card>
        <CardHeader>
          <CardTitle>Deck details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSaveDetails}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition notes</Label>
              <Input
                id="condition"
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save details'}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add a card</Label>
            <CardAutocomplete onSelect={handleAddCard} />
          </div>
          <Separator />
          <DeckCardList cards={cards} />
          {cards.length > 0 && (
            <div className="space-y-2">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {card.quantity}x {card.card_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCard(card.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <div className="space-y-2">
            <Label>Replace from Moxfield or Archidekt URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://www.moxfield.com/decks/..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchUrl}
                disabled={fetchingUrl || !importUrl.trim()}
              >
                {fetchingUrl ? 'Fetching...' : 'Fetch'}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Replace decklist (paste text)</Label>
            <textarea
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              placeholder="Paste a full decklist to replace all cards..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={handleImport}
              disabled={!importText.trim()}
            >
              Import & replace
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo">Upload a photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={getDeckPhotoUrl(photo.storage_path)}
                    alt="Deck photo"
                    className="h-32 w-full rounded object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 px-2 text-xs"
                    onClick={() => handleDeletePhoto(photo)}
                  >
                    X
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <Button variant="destructive" onClick={handleDeleteDeck}>
            Delete deck
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
