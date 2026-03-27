'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWantList, updateWantList } from '@/lib/services/wantlists'
import type { WantList } from '@/types'
import { FORMATS, ARCHETYPES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  const [commanderName, setCommanderName] = useState(
    existing?.commander_name ?? '',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Looking for a competitive commander deck"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="format">Format</Label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Any format</option>
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="archetype">Archetype</Label>
          <select
            id="archetype"
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Any archetype</option>
            {ARCHETYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="commander">Commander (optional)</Label>
        <Input
          id="commander"
          placeholder="e.g. Atraxa, Praetors' Voice"
          value={commanderName}
          onChange={(e) => setCommanderName(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Leave blank to match any commander in the chosen format.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="minValue">Min value ($)</Label>
          <Input
            id="minValue"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxValue">Max value ($)</Label>
          <Input
            id="maxValue"
            type="number"
            min="0"
            step="0.01"
            placeholder="No limit"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Any other details about what you're looking for…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        type="submit"
        className="w-full"
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
    </form>
  )
}
