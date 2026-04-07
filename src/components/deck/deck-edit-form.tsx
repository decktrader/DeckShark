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
import { resolveCardPrinting } from '@/lib/services/cards'
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
import { FORMATS, ARCHETYPES, POWER_LEVELS } from '@/lib/constants'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Info,
  ChevronDown,
  ChevronUp,
  Settings,
  Layers,
  Camera,
  FileText,
  Trash2,
  AlertTriangle,
  Upload,
} from 'lucide-react'
import { ColorIdentitySelector } from '@/components/ui/color-identity-selector'
import { CommanderAutocomplete } from '@/components/deck/commander-autocomplete'
import { DeckArt } from '@/components/deck/deck-art'
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
import { PrintingSelector } from '@/components/deck/printing-selector'

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
  const [powerLevel, setPowerLevel] = useState(deck.power_level ?? '')
  const [colorIdentity, setColorIdentity] = useState<string[]>(
    deck.color_identity ?? [],
  )
  const [description, setDescription] = useState(deck.description ?? '')
  const [conditionNotes, setConditionNotes] = useState(
    deck.condition_notes ?? '',
  )
  const [commanderName, setCommanderName] = useState(deck.commander_name ?? '')
  const [partnerCommanderName, setPartnerCommanderName] = useState(
    deck.partner_commander_name ?? '',
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

    // Resolve commander scryfall IDs if names changed
    let commanderScryfallId = deck.commander_scryfall_id
    if (commanderName.trim() && commanderName !== deck.commander_name) {
      const scryfallCard = await getCardByName(commanderName.trim())
      commanderScryfallId = scryfallCard?.id ?? null
    } else if (!commanderName.trim()) {
      commanderScryfallId = null
    }

    let partnerScryfallId = deck.partner_commander_scryfall_id
    if (
      partnerCommanderName.trim() &&
      partnerCommanderName !== deck.partner_commander_name
    ) {
      const scryfallCard = await getCardByName(partnerCommanderName.trim())
      partnerScryfallId = scryfallCard?.id ?? null
    } else if (!partnerCommanderName.trim()) {
      partnerScryfallId = null
    }

    const { data, error: err } = await updateDeck(deck.id, {
      name,
      format,
      archetype: archetype || null,
      power_level: powerLevel || null,
      color_identity: colorIdentity,
      description: description || null,
      condition_notes: conditionNotes || null,
      commander_name: commanderName.trim() || null,
      commander_scryfall_id: commanderScryfallId,
      partner_commander_name: partnerCommanderName.trim() || null,
      partner_commander_scryfall_id: partnerScryfallId,
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
      const { data: match } = await resolveCardPrinting(card.card_name)
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

  async function handleChangePrinting(
    card: DeckCard,
    printing: { scryfall_id: string; price_usd_cents: number | null },
  ) {
    await updateDeckCard(card.id, {
      scryfall_id: printing.scryfall_id,
      price_cents: printing.price_usd_cents,
    })
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id
          ? {
              ...c,
              scryfall_id: printing.scryfall_id,
              price_cents: printing.price_usd_cents,
            }
          : c,
      ),
    )
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
      // Include (SET) collector format so the text parser preserves printing info
      const lines = data.cards.map(
        (c: {
          name: string
          quantity: number
          isCommander: boolean
          setCode?: string
          collectorNumber?: string
        }) => {
          const setInfo = c.setCode
            ? ` (${c.setCode})${c.collectorNumber ? ` ${c.collectorNumber}` : ''}`
            : ''
          return c.isCommander
            ? `COMMANDER: ${c.name}${setInfo}`
            : `${c.quantity}x ${c.name}${setInfo}`
        },
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

    // Resolve cards to specific printings (using set code + collector number when available)
    const resolved = await Promise.all(
      parsedCards.map(async (parsed) => {
        const { data: match } = await resolveCardPrinting(
          parsed.name,
          parsed.setCode,
          parsed.collectorNumber,
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

    // Update commanders (support partner pairs)
    const commanders = resolved.filter((c) => c.is_commander)
    if (commanders.length > 0) {
      const updates: Record<string, string | null> = {
        commander_name: commanders[0].card_name,
        commander_scryfall_id: commanders[0].scryfall_id ?? null,
        partner_commander_name: commanders[1]?.card_name ?? null,
        partner_commander_scryfall_id: commanders[1]?.scryfall_id ?? null,
      }
      await updateDeck(deck.id, updates)
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

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['details', 'cards']),
  )

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const commanderLabel = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  const totalValue = cards.reduce((sum, c) => sum + (c.price_cents ?? 0), 0)

  return (
    <div className="space-y-3">
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Hero with overlaid stats */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5">
        <DeckArt
          commanderScryfallId={deck.commander_scryfall_id}
          partnerScryfallId={deck.partner_commander_scryfall_id}
          aspect="h-48 sm:h-60"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-black text-white drop-shadow-lg">
                {deck.name}
              </h1>
              <p className="mt-0.5 text-sm text-white/60">
                {commanderLabel || 'No commander set'}
                {' · '}
                <span className="capitalize">{deck.format}</span>
              </p>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <p className="text-xl font-bold text-white">{cards.length}</p>
                <p className="text-[10px] text-white/50 uppercase">Cards</p>
              </div>
              <div>
                <p className="text-primary text-xl font-bold">
                  ${(totalValue / 100).toFixed(0)}
                </p>
                <p className="text-[10px] text-white/50 uppercase">Value</p>
              </div>
              {deck.power_level && (
                <div>
                  <p className="text-xl font-bold text-white">
                    B{deck.power_level.replace('bracket', '')}
                  </p>
                  <p className="text-[10px] text-white/50 uppercase">Bracket</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Deck Details ── */}
      <Card>
        <button
          onClick={() => toggleSection('details')}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <Settings className="h-4 w-4" />
            </div>
            <p className="font-semibold">Deck Details</p>
          </div>
          {openSections.has('details') ? (
            <ChevronUp className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          )}
        </button>
        {openSections.has('details') && (
          <CardContent className="border-t pt-4">
            <form onSubmit={handleSaveDetails}>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    <Label htmlFor="edit-commander">Commander</Label>
                    <CommanderAutocomplete
                      id="edit-commander"
                      value={commanderName}
                      onChange={setCommanderName}
                      onColorIdentity={(colors) => {
                        const partner = deck.partner_commander_name
                          ? colorIdentity.filter(
                              (c) =>
                                !colors.includes(c) ||
                                colorIdentity.includes(c),
                            )
                          : []
                        setColorIdentity([...new Set([...colors, ...partner])])
                      }}
                      placeholder="e.g. Atraxa, Praetors' Voice"
                    />
                  </div>
                </div>
                {format === 'commander' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-partner">Second commander</Label>
                    <CommanderAutocomplete
                      id="edit-partner"
                      value={partnerCommanderName}
                      onChange={setPartnerCommanderName}
                      onColorIdentity={(colors) => {
                        setColorIdentity((prev) => [
                          ...new Set([...prev, ...colors]),
                        ])
                      }}
                      placeholder="e.g. Tymna the Weaver"
                    />
                    <p className="text-muted-foreground text-xs">
                      Partner, Background, Friends Forever, etc.
                    </p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-3">
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
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="power-level">Power level</Label>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-xs text-xs"
                          >
                            <p className="font-semibold">Commander Brackets</p>
                            <ul className="mt-1 space-y-0.5">
                              <li>
                                <strong>1 — Exhibition:</strong> Ultra-casual
                              </li>
                              <li>
                                <strong>2 — Core:</strong> Precon level
                              </li>
                              <li>
                                <strong>3 — Upgraded:</strong> Beyond precon
                              </li>
                              <li>
                                <strong>4 — Optimized:</strong> High power
                              </li>
                              <li>
                                <strong>5 — cEDH:</strong> Competitive
                              </li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select
                      value={powerLevel || 'none'}
                      onValueChange={(v) =>
                        setPowerLevel(v === 'none' ? '' : v)
                      }
                    >
                      <SelectTrigger id="power-level">
                        <SelectValue placeholder="Not specified" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {POWER_LEVELS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color identity</Label>
                  <ColorIdentitySelector
                    value={colorIdentity}
                    onChange={setColorIdentity}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sleeves"
                      checked={includesSleeves}
                      onCheckedChange={(v) => setIncludesSleeves(!!v)}
                    />
                    <Label
                      htmlFor="sleeves"
                      className="cursor-pointer font-normal"
                    >
                      Sleeves
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="deckbox"
                      checked={includesDeckbox}
                      onCheckedChange={(v) => setIncludesDeckbox(!!v)}
                    />
                    <Label
                      htmlFor="deckbox"
                      className="cursor-pointer font-normal"
                    >
                      Deckbox
                    </Label>
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save details'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* ── Section: Cards ── */}
      <Card>
        <button
          onClick={() => toggleSection('cards')}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <Layers className="h-4 w-4" />
            </div>
            <p className="font-semibold">Cards ({cards.length})</p>
          </div>
          {openSections.has('cards') ? (
            <ChevronUp className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          )}
        </button>
        {openSections.has('cards') && (
          <CardContent className="space-y-4 border-t pt-4">
            {!bulkMode && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <CardAutocomplete onSelect={handleAddCard} />
                </div>
                {cards.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkMode((prev) => !prev)
                      setSelected(new Set())
                    }}
                  >
                    Bulk edit
                  </Button>
                )}
              </div>
            )}
            {bulkMode && (
              <div className="flex items-center justify-between">
                <button
                  className="text-muted-foreground flex items-center gap-2 text-xs"
                  onClick={toggleSelectAll}
                >
                  <Checkbox checked={selected.size === cards.length} />
                  Select all
                </button>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selected.size === 0}
                    onClick={handleBulkDelete}
                  >
                    Delete {selected.size > 0 ? `(${selected.size})` : ''}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkMode(false)
                      setSelected(new Set())
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <Separator />
            {cards.length > 0 && (
              <div className="space-y-1">
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
                    {!bulkMode && card.price_cents != null && (
                      <span className="text-muted-foreground shrink-0 text-xs">
                        ${(card.price_cents / 100).toFixed(2)}
                      </span>
                    )}
                    {!bulkMode && card.scryfall_id && (
                      <PrintingSelector
                        card={card}
                        onSelect={(printing) =>
                          handleChangePrinting(card, printing)
                        }
                      />
                    )}
                    {!bulkMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-7 w-7 shrink-0 p-0"
                            aria-label="Card options"
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
          </CardContent>
        )}
      </Card>

      {/* ── Section: Import / Replace ── */}
      <Card>
        <button
          onClick={() => toggleSection('import')}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <p className="font-semibold">Import / Replace</p>
          </div>
          {openSections.has('import') ? (
            <ChevronUp className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          )}
        </button>
        {openSections.has('import') && (
          <CardContent className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Import from Moxfield or Archidekt</Label>
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
            <div className="relative flex items-center">
              <Separator className="flex-1" />
              <span className="text-muted-foreground bg-card px-3 text-xs">
                or paste below
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="space-y-2">
              <textarea
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
                placeholder="Paste a full decklist to replace all cards..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleImport}
                disabled={!importText.trim()}
              >
                Import &amp; replace
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Section: Photos ── */}
      <Card>
        <button
          onClick={() => toggleSection('photos')}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <Camera className="h-4 w-4" />
            </div>
            <p className="font-semibold">
              Photos{photos.length > 0 ? ` (${photos.length})` : ''}
            </p>
          </div>
          {openSections.has('photos') ? (
            <ChevronUp className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          )}
        </button>
        {openSections.has('photos') && (
          <CardContent className="space-y-4 border-t pt-4">
            <div
              className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 py-10 transition-colors hover:border-white/20"
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add(
                  'border-primary/50',
                  'bg-primary/5',
                )
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove(
                  'border-primary/50',
                  'bg-primary/5',
                )
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove(
                  'border-primary/50',
                  'bg-primary/5',
                )
                const file = e.dataTransfer.files[0]
                if (file && file.type.startsWith('image/')) {
                  const input = document.getElementById(
                    'photo',
                  ) as HTMLInputElement
                  const dt = new DataTransfer()
                  dt.items.add(file)
                  input.files = dt.files
                  input.dispatchEvent(new Event('change', { bubbles: true }))
                }
              }}
            >
              <Upload className="text-muted-foreground mb-3 h-8 w-8" />
              <p className="text-muted-foreground mb-3 text-sm">
                Drag and drop a photo here, or
              </p>
              <Button
                type="button"
                disabled={uploading}
                onClick={() => document.getElementById('photo')?.click()}
              >
                {uploading ? 'Uploading...' : 'Upload photo'}
              </Button>
              <input
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
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
                      aria-label="Delete photo"
                      onClick={() => handleDeletePhoto(photo)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Danger zone ── */}
      <Card className="border-destructive/50">
        <CardContent className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <div>
              <p className="text-sm font-medium">Danger zone</p>
              <p className="text-muted-foreground text-xs">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={handleDeleteDeck}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete deck
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
