'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWantList, updateWantList } from '@/lib/services/wantlists'
import type { WantList } from '@/types'
import { FORMATS, ARCHETYPES, POWER_LEVELS } from '@/lib/constants'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { ColorIdentitySelector } from '@/components/ui/color-identity-selector'
import { CommanderAutocomplete } from '@/components/deck/commander-autocomplete'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function WantListForm({
  userId,
  existing,
}: {
  userId: string
  existing?: WantList
}) {
  const router = useRouter()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [format, setFormat] = useState(existing?.format ?? '')
  const [archetype, setArchetype] = useState(existing?.archetype ?? '')
  const [powerLevel, setPowerLevel] = useState(existing?.power_level ?? '')
  const [commanderName, setCommanderName] = useState(
    existing?.commander_name ?? '',
  )
  const [colorIdentity, setColorIdentity] = useState<string[]>(
    existing?.color_identity ?? [],
  )
  const [minValue, setMinValue] = useState(
    existing?.min_value_cents ? String(existing.min_value_cents / 100) : '',
  )
  const [maxValue, setMaxValue] = useState(
    existing?.max_value_cents ? String(existing.max_value_cents / 100) : '',
  )
  const [description, setDescription] = useState(existing?.description ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['what', 'filters']),
  )

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const input = {
      title: title.trim(),
      format: format || undefined,
      archetype: archetype || undefined,
      commander_name: commanderName.trim() || undefined,
      color_identity: colorIdentity.length ? colorIdentity : undefined,
      power_level: powerLevel || undefined,
      min_value_cents: minValue
        ? Math.round(parseFloat(minValue) * 100)
        : undefined,
      max_value_cents: maxValue
        ? Math.round(parseFloat(maxValue) * 100)
        : undefined,
      description: description.trim() || undefined,
    }

    const { error: err } = existing
      ? await updateWantList(existing.id, input)
      : await createWantList(userId, input)

    if (err) {
      setError(err)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const sections = [
    {
      id: 'what',
      num: 1,
      title: 'Deck Description',
      subtitle: 'Title and commander — what deck do you want?',
      required: true,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Looking for a competitive commander deck"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl-commander">Commander</Label>
            <CommanderAutocomplete
              id="wl-commander"
              value={commanderName}
              onChange={setCommanderName}
              onColorIdentity={setColorIdentity}
              placeholder="e.g. Atraxa, Praetors' Voice"
            />
            <p className="text-muted-foreground text-xs">
              Leave blank to match any commander.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'filters',
      num: 2,
      title: 'Deck Filters',
      subtitle: 'Format, archetype, power level, color identity',
      required: false,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="wl-format">Format</Label>
              <Select
                value={format || 'any'}
                onValueChange={(v) => setFormat(v === 'any' ? '' : v)}
              >
                <SelectTrigger id="wl-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any format</SelectItem>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-archetype">Archetype</Label>
              <Select
                value={archetype || 'any'}
                onValueChange={(v) => setArchetype(v === 'any' ? '' : v)}
              >
                <SelectTrigger id="wl-archetype">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="any">Any archetype</SelectItem>
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
                <Label htmlFor="wl-power">Power level</Label>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-xs">
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
                value={powerLevel || 'any'}
                onValueChange={(v) => setPowerLevel(v === 'any' ? '' : v)}
              >
                <SelectTrigger id="wl-power">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
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
            <p className="text-muted-foreground text-xs">
              Auto-detected from commander. Select colors the deck must include.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'budget',
      num: 3,
      title: 'Budget Range',
      subtitle: 'Optional — minimum and maximum deck value',
      required: false,
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wl-min">Min value</Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                id="wl-min"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                className="pl-7"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl-max">Max value</Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                id="wl-max"
                type="number"
                min="0"
                step="1"
                placeholder="No limit"
                className="pl-7"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'notes',
      num: 4,
      title: 'Additional Notes',
      subtitle: 'Optional — anything else to mention',
      required: false,
      content: (
        <Textarea
          id="wl-description"
          placeholder="Specific cards, conditions, preferred sets, must-haves…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      ),
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          {existing ? 'Edit want list' : 'Create a want list'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Describe the deck you&apos;re looking for and get notified when a
          match is listed.
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
              disabled={loading || !title.trim()}
            >
              {loading
                ? existing
                  ? 'Saving…'
                  : 'Creating…'
                : existing
                  ? 'Save changes'
                  : 'Create want list'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
