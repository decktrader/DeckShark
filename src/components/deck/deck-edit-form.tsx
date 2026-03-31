'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateDeck,
  deleteDeck,
  addDeckCards,
  deleteDeckCard,
  updateDeckCard,
  clearDeckCards,
  calculateDeckValue,
} from '@/lib/services/decks'
import { searchCards } from '@/lib/services/cards'
import { getCardByName } from '@/lib/scryfall/api'
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
import { FORMATS, ARCHETYPES } from '@/lib/constants'
import type { Deck, DeckCard, DeckPhoto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
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
  const [archetype, setArchetype] = useState(deck.archetype ?? '')
  const [description, setDescription] = useState(deck.description ?? '')
  const [conditionNotes, setConditionNotes] = useState(
    deck.condition_notes ?? '',
  )
  const [includesSleeves, setIncludesSleeves] = useState(deck.includes_sleeves)
  const [includesDeckbox, setIncludesDeckbox] = useState(deck.includes_deckbox)
  const [importText, setImportText] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data, error: err } = await updateDeck(deck.id, {
      name,
      format,
      archetype: archetype || null,
      description: description || null,
      condition_notes: conditionNotes || null,
      includes_sleeves: includesSleeves,
      includes_deckbox: includesDeckbox,
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

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === cards.length ? new Set() : new Set(cards.map((c) => c.id)),
    )
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    await Promise.all([...selected].map((id) => deleteDeckCard(id)))
    setCards((prev) => prev.filter((c) => !selected.has(c.id)))
    setSelected(new Set())
    setBulkMode(false)
    await calculateDeckValue(deck.id)
    const { getDeck } = await import('@/lib/services/decks')
    const { data: updated } = await getDeck(deck.id)
    if (updated) setDeck(updated)
  }

  async function handleSetCommander(card: (typeof cards)[number]) {
    // Clear is_commander on any existing commander
    const currentCommander = cards.find((c) => c.is_commander)
    if (currentCommander && currentCommander.id !== card.id) {
      await updateDeckCard(currentCommander.id, { is_commander: false })
    }
    // Resolve scryfall_id if missing — try card cache first, then Scryfall directly
    let scryfallId = card.scryfall_id ?? undefined
    if (!scryfallId) {
      const { data: matches } = await searchCards(card.card_name, 1)
      const match = matches?.find(
        (m) => m.name.toLowerCase() === card.card_name.toLowerCase(),
      )
      if (match) {
        scryfallId = match.scryfall_id
      } else {
        const scryfallCard = await getCardByName(card.card_name)
        if (scryfallCard) scryfallId = scryfallCard.id
      }
    }
    await updateDeckCard(card.id, { is_commander: true })
    await updateDeck(deck.id, {
      commander_name: card.card_name,
      commander_scryfall_id: scryfallId,
    })
    setCards((prev) =>
      prev.map((c) => ({ ...c, is_commander: c.id === card.id })),
    )
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

  const commanderImageUrl = deck.commander_scryfall_id
    ? `https://cards.scryfall.io/normal/front/${deck.commander_scryfall_id[0]}/${deck.commander_scryfall_id[1]}/${deck.commander_scryfall_id}.jpg`
    : null

  return (
    <div className="space-y-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Commander card + stats */}
      <div className="flex gap-6">
        {commanderImageUrl && (
          <div className="shrink-0">
            <img
              src={commanderImageUrl}
              alt={deck.commander_name ?? 'Commander'}
              className="w-56 rounded-xl shadow-lg shadow-black/40"
            />
          </div>
        )}
        <div className="flex items-start pt-1">
          <DeckStats deck={deck} cards={cards} />
        </div>
      </div>

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
              <Label htmlFor="archetype">Archetype</Label>
              <Select
                value={archetype || 'none'}
                onValueChange={(v) => setArchetype(v === 'none' ? '' : v)}
              >
                <SelectTrigger id="archetype">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">None</SelectItem>
                  {ARCHETYPES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
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
            <div className="space-y-3">
              <Label>Included accessories</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sleeves"
                  checked={includesSleeves}
                  onCheckedChange={(v) => setIncludesSleeves(!!v)}
                />
                <Label htmlFor="sleeves" className="cursor-pointer font-normal">
                  Selling with Sleeves
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="deckbox"
                  checked={includesDeckbox}
                  onCheckedChange={(v) => setIncludesDeckbox(!!v)}
                />
                <Label htmlFor="deckbox" className="cursor-pointer font-normal">
                  Selling with Deckbox
                </Label>
              </div>
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
          <div className="flex items-center justify-between">
            <CardTitle>Cards</CardTitle>
            {cards.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkMode((prev) => !prev)
                  setSelected(new Set())
                }}
              >
                {bulkMode ? 'Cancel' : 'Bulk edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!bulkMode && (
            <div className="space-y-2">
              <Label>Add a card</Label>
              <CardAutocomplete onSelect={handleAddCard} />
            </div>
          )}
          <Separator />
          {cards.length > 0 && (
            <div className="space-y-1">
              {bulkMode && (
                <div className="flex items-center justify-between pb-1">
                  <button
                    className="text-muted-foreground flex items-center gap-2 text-xs"
                    onClick={toggleSelectAll}
                  >
                    <Checkbox checked={selected.size === cards.length} />
                    Select all
                  </button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selected.size === 0}
                    onClick={handleBulkDelete}
                  >
                    Delete {selected.size > 0 ? `(${selected.size})` : ''}
                  </Button>
                </div>
              )}
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  {bulkMode && (
                    <Checkbox
                      checked={selected.has(card.id)}
                      onCheckedChange={() => toggleSelected(card.id)}
                      className="shrink-0"
                    />
                  )}
                  <span className="flex flex-1 items-center gap-2 truncate">
                    {card.quantity}x {card.card_name}
                    {card.is_commander && (
                      <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
                        Commander
                      </span>
                    )}
                  </span>
                  {!bulkMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground h-7 w-7 shrink-0 p-0"
                        >
                          ···
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!card.is_commander && (
                          <DropdownMenuItem
                            onClick={() => handleSetCommander(card)}
                          >
                            Set as commander
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemoveCard(card.id)}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
          {!bulkMode && <Separator />}
          {!bulkMode && (
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
          )}
          {!bulkMode && (
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
          )}
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
