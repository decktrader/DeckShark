'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createDeck,
  addDeckCards,
  calculateDeckValue,
} from '@/lib/services/decks'
import { resolveCardPrinting } from '@/lib/services/cards'
import { parseDecklist } from '@/lib/importers/text'
import { getCardByName } from '@/lib/scryfall/api'
import { FORMATS, ARCHETYPES, POWER_LEVELS } from '@/lib/constants'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { ColorIdentitySelector } from '@/components/ui/color-identity-selector'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  const [commanderName, setCommanderName] = useState('')
  const [format, setFormat] = useState('commander')
  const [archetype, setArchetype] = useState('')
  const [powerLevel, setPowerLevel] = useState('')
  const [colorIdentity, setColorIdentity] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [decklistText, setDecklistText] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [includesSleeves, setIncludesSleeves] = useState(false)
  const [includesDeckbox, setIncludesDeckbox] = useState(false)
  const [loading, setLoading] = useState(false)

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

    if (data.errors?.length) setParseErrors(data.errors)
    if (data.cards?.length > 0) {
      // Convert parsed cards to text so the existing submit flow can use them
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
      setDecklistText(lines.join('\n'))
      setImportUrl('')
    } else {
      setError('No cards found at that URL.')
    }
    setFetchingUrl(false)
  }

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

    // Find the commander — explicit field takes priority, then decklist COMMANDER: line
    const commanderFromList = parsedCards.find((c) => c.isCommander)
    const resolvedCommanderName =
      commanderName.trim() || commanderFromList?.name

    // Create the deck
    const { data: deck, error: deckError } = await createDeck(userId, {
      name,
      format,
      archetype: archetype || undefined,
      power_level: powerLevel || undefined,
      color_identity: colorIdentity.length ? colorIdentity : undefined,
      description: description || undefined,
      condition_notes: conditionNotes || undefined,
      commander_name: resolvedCommanderName,
      includes_sleeves: includesSleeves,
      includes_deckbox: includesDeckbox,
    })

    if (deckError || !deck) {
      setError(deckError ?? 'Failed to create deck.')
      setLoading(false)
      return
    }

    // Resolve card names to specific printings (using set code + collector number when available)
    const resolvedCards = await Promise.all(
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

    // Set commander_scryfall_id — try cache first, fall back to Scryfall directly
    if (resolvedCommanderName) {
      const commanderCard = resolvedCards.find((c) => c.is_commander)
      let commanderScryfallId = commanderCard?.scryfall_id
      if (!commanderScryfallId) {
        const scryfallCard = await getCardByName(resolvedCommanderName)
        if (scryfallCard) commanderScryfallId = scryfallCard.id
      }
      if (commanderScryfallId) {
        const { updateDeck } = await import('@/lib/services/decks')
        await updateDeck(deck.id, {
          commander_scryfall_id: commanderScryfallId,
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

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['identity', 'decklist']),
  )

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sections = [
    {
      id: 'identity',
      num: 1,
      title: 'Deck Identity',
      subtitle: 'Name, commander, format, colors',
      required: true,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="commander">Commander</Label>
              <Input
                id="commander"
                placeholder="e.g. Atraxa, Praetors' Voice"
                value={commanderName}
                onChange={(e) => setCommanderName(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Also detected from COMMANDER: lines in your decklist
              </p>
            </div>
          </div>
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
                  <SelectValue placeholder="Any archetype" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">Any archetype</SelectItem>
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
                    <TooltipContent side="right" className="max-w-xs text-xs">
                      <p className="font-semibold">Commander Brackets</p>
                      <ul className="mt-1 space-y-0.5">
                        <li>
                          <strong>1 — Exhibition:</strong> Ultra-casual, no
                          combos
                        </li>
                        <li>
                          <strong>2 — Core:</strong> Average precon level
                        </li>
                        <li>
                          <strong>3 — Upgraded:</strong> Beyond precon strength
                        </li>
                        <li>
                          <strong>4 — Optimized:</strong> High power, no
                          restrictions
                        </li>
                        <li>
                          <strong>5 — cEDH:</strong> Competitive,
                          metagame-focused
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={powerLevel || 'none'}
                onValueChange={(v) => setPowerLevel(v === 'none' ? '' : v)}
              >
                <SelectTrigger id="power-level">
                  <SelectValue placeholder="Select" />
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
        </div>
      ),
    },
    {
      id: 'details',
      num: 2,
      title: 'Condition & Extras',
      subtitle: 'Optional — description, condition, accessories',
      required: false,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of your deck"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition notes</Label>
            <Input
              id="condition"
              placeholder="e.g. NM/LP, some cards are proxied"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="sleeves"
                checked={includesSleeves}
                onCheckedChange={(v) => setIncludesSleeves(!!v)}
              />
              <Label htmlFor="sleeves" className="cursor-pointer font-normal">
                Sleeves
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="deckbox"
                checked={includesDeckbox}
                onCheckedChange={(v) => setIncludesDeckbox(!!v)}
              />
              <Label htmlFor="deckbox" className="cursor-pointer font-normal">
                Deckbox
              </Label>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'decklist',
      num: 3,
      title: 'Decklist',
      subtitle: 'Paste your decklist or import from a URL',
      required: true,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-url">
              Import from Moxfield or Archidekt
            </Label>
            <div className="flex gap-2">
              <Input
                id="import-url"
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
              id="decklist"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[200px] w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={`COMMANDER: Atraxa, Praetors' Voice\n1x Sol Ring\n1x Arcane Signet\n4x Lightning Bolt`}
              value={decklistText}
              onChange={(e) => setDecklistText(e.target.value)}
              required
            />
          </div>
          {parseErrors.length > 0 && (
            <div className="rounded border border-yellow-600/30 bg-yellow-500/10 p-3 text-sm">
              <p className="font-medium text-yellow-200">
                Some lines could not be parsed:
              </p>
              <ul className="mt-1 list-inside list-disc text-yellow-300/80">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          Create a new deck
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Complete the required sections to list your deck for trade.
        </p>
      </div>

      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="divide-y p-0">
            {sections.map((section) => {
              const isOpen = openSections.has(section.id)
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[2%]"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isOpen
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {section.num}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{section.title}</p>
                        {section.required && (
                          <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {section.subtitle}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="text-muted-foreground h-5 w-5 shrink-0" />
                    ) : (
                      <ChevronDown className="text-muted-foreground h-5 w-5 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-primary/30 ml-6 border-l-2 pr-6 pb-6 pl-8">
                      {section.content}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !name || (!decklistText && !fetchingUrl)}
            >
              {loading ? 'Creating deck...' : 'Create deck'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
