'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColorIdentitySelector } from '@/components/ui/color-identity-selector'
import { CommanderAutocomplete } from '@/components/ui/commander-autocomplete'
import { CityAutocomplete } from '@/components/ui/city-autocomplete'
import {
  FORMATS,
  COUNTRIES,
  getAllRegions,
  ARCHETYPES,
  POWER_LEVELS,
  SORT_OPTIONS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

// ---------- helpers ----------

function buildParams(
  current: URLSearchParams,
  updates: Record<string, string | string[] | null>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString())
  next.delete('page')
  for (const [key, val] of Object.entries(updates)) {
    if (
      val === null ||
      val === '' ||
      (Array.isArray(val) && val.length === 0)
    ) {
      next.delete(key)
    } else if (Array.isArray(val)) {
      next.set(key, val.join(','))
    } else {
      next.set(key, val)
    }
  }
  return next
}

// ---------- quick filter chip ----------

interface QuickChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function QuickChip({ label, active, onClick }: QuickChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

// ---------- section header ----------

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {title}
      </p>
      {children}
    </div>
  )
}

// ---------- main component ----------

interface BrowseFiltersProps {
  defaultCity?: string | null
  defaultProvince?: string | null
}

export function BrowseFilters({
  defaultCity,
  defaultProvince,
}: BrowseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [panelOpen, setPanelOpen] = useState(false)
  const didInit = useRef(false)

  const colorIdentity =
    searchParams.get('colorIdentity')?.split(',').filter(Boolean) ?? []
  const powerLevel = searchParams.get('powerLevel') ?? ''
  const archetype = searchParams.get('archetype') ?? ''
  const sortBy = searchParams.get('sortBy') ?? ''
  const format = searchParams.get('format') ?? ''
  const province = searchParams.get('province') ?? ''

  const hasFilters =
    searchParams.has('format') ||
    searchParams.has('province') ||
    searchParams.has('city') ||
    searchParams.has('commander') ||
    searchParams.has('minValue') ||
    searchParams.has('maxValue') ||
    searchParams.has('powerLevel') ||
    searchParams.has('colorIdentity') ||
    searchParams.has('archetype') ||
    searchParams.has('sortBy')

  const updateFilter = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const next = buildParams(searchParams, updates)
      const str = next.toString()
      router.replace(str ? `/decks?${str}` : '/decks')
    },
    [router, searchParams],
  )

  // On first mount: if no location filters set and user has a profile city,
  // apply it automatically so results are scoped to their area by default.
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    if (
      !searchParams.has('city') &&
      !searchParams.has('province') &&
      defaultProvince
    ) {
      updateFilter({
        province: defaultProvince,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function clearFilters() {
    router.replace('/decks')
  }

  function toggleQuick(updates: Record<string, string | null>) {
    const allActive = Object.entries(updates).every(
      ([k, v]) => searchParams.get(k) === v,
    )
    if (allActive) {
      updateFilter(
        Object.fromEntries(Object.keys(updates).map((k) => [k, null])),
      )
    } else {
      updateFilter(updates)
    }
  }

  const isCedh = searchParams.get('powerLevel') === 'bracket5'
  const isUnder200 = searchParams.get('maxValue') === '20000'
  const isOptimized = searchParams.get('powerLevel') === 'bracket4'

  return (
    <div className="bg-card space-y-4 rounded-lg border p-4">
      {/* Row 1: Quick filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">
          Quick:
        </span>
        <QuickChip
          label="cEDH"
          active={isCedh}
          onClick={() => toggleQuick({ powerLevel: 'bracket5' })}
        />
        <QuickChip
          label="Optimized"
          active={isOptimized}
          onClick={() => toggleQuick({ powerLevel: 'bracket4' })}
        />
        <QuickChip
          label="Under $200"
          active={isUnder200}
          onClick={() => toggleQuick({ maxValue: '20000' })}
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground ml-auto h-7 gap-1 px-2 text-xs"
            aria-label="Clear all filters"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Row 2: Price + Location */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="min-value-filter">Min ($)</Label>
          <Input
            id="min-value-filter"
            type="number"
            min={0}
            placeholder="0"
            defaultValue={
              searchParams.get('minValue')
                ? String(Number(searchParams.get('minValue')) / 100)
                : ''
            }
            onBlur={(e) => {
              const dollars = parseFloat(e.target.value)
              updateFilter({
                minValue: isNaN(dollars)
                  ? null
                  : String(Math.round(dollars * 100)),
              })
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="max-value-filter">Max ($)</Label>
          <Input
            id="max-value-filter"
            type="number"
            min={0}
            placeholder="Any"
            defaultValue={
              searchParams.get('maxValue')
                ? String(Number(searchParams.get('maxValue')) / 100)
                : ''
            }
            onBlur={(e) => {
              const dollars = parseFloat(e.target.value)
              updateFilter({
                maxValue: isNaN(dollars)
                  ? null
                  : String(Math.round(dollars * 100)),
              })
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="province-filter">State / Province</Label>
          <Select
            value={province || 'all'}
            onValueChange={(v) =>
              updateFilter({ province: v === 'all' ? null : v })
            }
          >
            <SelectTrigger id="province-filter">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All regions</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectGroup key={c.value}>
                  <SelectLabel>{c.label}</SelectLabel>
                  {getAllRegions()
                    .filter((r) => r.country === c.value)
                    .map((r) => (
                      <SelectItem key={`${c.value}-${r.value}`} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city-filter">City</Label>
          <CityAutocomplete
            key={searchParams.get('city') ?? 'empty'}
            id="city-filter"
            defaultValue={searchParams.get('city') ?? ''}
            onCommit={(v) => updateFilter({ city: v || null })}
            placeholder="e.g. Vancouver"
          />
        </div>
      </div>

      {/* More/Hide filters toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPanelOpen((o) => !o)}
          className="gap-1.5"
          aria-expanded={panelOpen}
          aria-controls="filter-panel"
        >
          {panelOpen ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Hide filters
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              More filters
            </>
          )}
        </Button>
      </div>

      {/* Expandable filter panel */}
      <div
        id="filter-panel"
        className={cn('space-y-5', !panelOpen && 'hidden')}
      >
        <Separator />

        {/* Gameplay */}
        <FilterSection title="Gameplay">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="format-filter">Format</Label>
              <Select
                value={format || 'all'}
                onValueChange={(v) =>
                  updateFilter({ format: v === 'all' ? null : v })
                }
              >
                <SelectTrigger id="format-filter">
                  <SelectValue placeholder="All formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All formats</SelectItem>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="commander-filter">Commander</Label>
              <CommanderAutocomplete
                key={searchParams.get('commander') ?? 'empty'}
                id="commander-filter"
                defaultValue={searchParams.get('commander') ?? ''}
                onCommit={(v) => updateFilter({ commander: v || null })}
                placeholder="e.g. Atraxa"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="power-level-filter">Power level</Label>
              <Select
                value={powerLevel || 'all'}
                onValueChange={(v) =>
                  updateFilter({ powerLevel: v === 'all' ? null : v })
                }
              >
                <SelectTrigger id="power-level-filter">
                  <SelectValue placeholder="Any power level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any power level</SelectItem>
                  {POWER_LEVELS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Color identity</Label>
              <ColorIdentitySelector
                value={colorIdentity}
                onChange={(colors) =>
                  updateFilter({ colorIdentity: colors.length ? colors : null })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="archetype-filter">Archetype</Label>
              <Select
                value={archetype || 'all'}
                onValueChange={(v) =>
                  updateFilter({ archetype: v === 'all' ? null : v })
                }
              >
                <SelectTrigger id="archetype-filter">
                  <SelectValue placeholder="Any archetype" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Any archetype</SelectItem>
                  {ARCHETYPES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterSection>

        {/* Sort */}
        <FilterSection title="Sort by">
          <div className="max-w-xs">
            <Select
              value={sortBy || 'recent'}
              onValueChange={(v) =>
                updateFilter({ sortBy: v === 'recent' ? null : v })
              }
            >
              <SelectTrigger id="sort-filter" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FilterSection>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPanelOpen(false)}
            className="gap-1.5"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Hide filters
          </Button>
        </div>
      </div>
    </div>
  )
}
