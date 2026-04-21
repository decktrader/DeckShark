'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ColorIdentitySelector } from '@/components/ui/color-identity-selector'
import { CommanderAutocomplete } from '@/components/ui/commander-autocomplete'
import { CityAutocomplete } from '@/components/ui/city-autocomplete'
import {
  FORMATS,
  COUNTRIES,
  getAllRegions,
  ARCHETYPES,
  POWER_LEVELS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { X, SlidersHorizontal, Plus, Minus } from 'lucide-react'

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

// ---------- sub-components ----------

function AccordionSection({
  label,
  preview,
  open,
  onToggle,
  children,
}: {
  label: string
  preview?: string | null
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3.5 py-[7px]"
      >
        <span
          className={cn(
            'flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px]',
            open
              ? 'bg-primary/15 text-primary'
              : 'bg-white/[0.06] text-white/30',
          )}
        >
          {open ? (
            <Minus className="h-2.5 w-2.5" />
          ) : (
            <Plus className="h-2.5 w-2.5" />
          )}
        </span>
        <span
          className={cn(
            'flex-1 text-left text-[11px]',
            open ? 'font-semibold text-white/75' : 'font-medium text-white/45',
          )}
        >
          {label}
        </span>
        {!open && preview && (
          <span className="text-primary/70 truncate text-[10px]">
            {preview}
          </span>
        )}
      </button>
      {open && <div className="px-3.5 pb-2.5 pl-[34px]">{children}</div>}
    </div>
  )
}

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
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
      )}
    >
      {label}
    </button>
  )
}

// ---------- shared filter content ----------

interface FilterContentProps {
  searchParams: URLSearchParams
  updateFilter: (updates: Record<string, string | string[] | null>) => void
  clearFilters: () => void
  hasFilters: boolean
  inputSize?: string
}

function FilterContent({
  searchParams,
  updateFilter,
  clearFilters,
  hasFilters,
  inputSize = 'h-8',
}: FilterContentProps) {
  const colorIdentity =
    searchParams.get('colorIdentity')?.split(',').filter(Boolean) ?? []
  const powerLevel = searchParams.get('powerLevel') ?? ''
  const archetype = searchParams.get('archetype') ?? ''
  const format = searchParams.get('format') ?? ''
  const province = searchParams.get('province') ?? ''
  const commander = searchParams.get('commander') ?? ''
  const city = searchParams.get('city') ?? ''
  const minValue = searchParams.get('minValue')
  const maxValue = searchParams.get('maxValue')

  const triggerClass = `${inputSize} border-white/10 bg-white/5 text-xs`

  // Determine which sections have active values (auto-open those)
  const hasPrice = !!(minValue || maxValue)
  const hasLocation = !!(province || city)
  const hasFormat = !!format
  const hasCommander = !!commander
  const hasPower = !!powerLevel
  const hasColors = colorIdentity.length > 0
  const hasArchetype = !!archetype

  // Track which sections are open — sections with active filters start open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    location: true,
    format: false,
    commander: false,
    power: false,
    colors: false,
    archetype: false,
  })

  function toggle(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Build preview strings for collapsed sections
  const pricePreview = hasPrice
    ? [
        minValue ? `$${Number(minValue) / 100}` : null,
        maxValue ? `$${Number(maxValue) / 100}` : null,
      ]
        .filter(Boolean)
        .join(' — ')
    : null

  const locationPreview = hasLocation
    ? [
        getAllRegions().find((r) => r.value === province)?.label ?? province,
        city,
      ]
        .filter(Boolean)
        .join(', ')
    : null

  const formatPreview = hasFormat
    ? (FORMATS.find((f) => f.value === format)?.label ?? format)
    : null

  const powerPreview = hasPower
    ? (POWER_LEVELS.find((p) => p.value === powerLevel)?.label?.replace(
        /^Bracket \d — /,
        '',
      ) ?? powerLevel)
    : null

  const COLOR_CATEGORY_LABELS: Record<string, string> = {
    _mono: 'Any mono',
    _dual: 'Any two-color',
    _tri: 'Any three-color',
    _four: 'Any four-color',
  }
  const colorPreview = hasColors
    ? (colorIdentity.length === 1 && COLOR_CATEGORY_LABELS[colorIdentity[0]]) ||
      colorIdentity.join(', ')
    : null

  return (
    <div>
      <AccordionSection
        label="Price range"
        preview={pricePreview}
        open={openSections.price || hasPrice}
        onToggle={() => toggle('price')}
      >
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min $"
            className={triggerClass}
            defaultValue={minValue ? String(Number(minValue) / 100) : ''}
            onBlur={(e) => {
              const dollars = parseFloat(e.target.value)
              updateFilter({
                minValue: isNaN(dollars)
                  ? null
                  : String(Math.round(dollars * 100)),
              })
            }}
          />
          <span className="text-muted-foreground text-xs">—</span>
          <Input
            type="number"
            min={0}
            placeholder="Max $"
            className={triggerClass}
            defaultValue={maxValue ? String(Number(maxValue) / 100) : ''}
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
      </AccordionSection>

      <AccordionSection
        label="Location"
        preview={locationPreview}
        open={openSections.location || hasLocation}
        onToggle={() => toggle('location')}
      >
        <div className="space-y-1.5">
          <Select
            value={province || 'all'}
            onValueChange={(v) =>
              updateFilter({ province: v === 'all' ? null : v })
            }
          >
            <SelectTrigger className={triggerClass}>
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
          <CityAutocomplete
            key={searchParams.get('city') ?? 'empty'}
            defaultValue={city}
            onCommit={(v) => updateFilter({ city: v || null })}
            placeholder="City"
          />
        </div>
      </AccordionSection>

      <AccordionSection
        label="Format"
        preview={formatPreview}
        open={openSections.format || hasFormat}
        onToggle={() => toggle('format')}
      >
        <Select
          value={format || 'all'}
          onValueChange={(v) =>
            updateFilter({ format: v === 'all' ? null : v })
          }
        >
          <SelectTrigger className={triggerClass}>
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
      </AccordionSection>

      <AccordionSection
        label="Commander"
        preview={hasCommander ? commander : null}
        open={openSections.commander || hasCommander}
        onToggle={() => toggle('commander')}
      >
        <CommanderAutocomplete
          key={commander || 'empty'}
          defaultValue={commander}
          onCommit={(v) => updateFilter({ commander: v || null })}
          placeholder="e.g. Atraxa"
        />
      </AccordionSection>

      <AccordionSection
        label="Power level"
        preview={powerPreview}
        open={openSections.power || hasPower}
        onToggle={() => toggle('power')}
      >
        <Select
          value={powerLevel || 'all'}
          onValueChange={(v) =>
            updateFilter({ powerLevel: v === 'all' ? null : v })
          }
        >
          <SelectTrigger className={triggerClass}>
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
      </AccordionSection>

      <AccordionSection
        label="Color identity"
        preview={colorPreview}
        open={openSections.colors || hasColors}
        onToggle={() => toggle('colors')}
      >
        <ColorIdentitySelector
          value={colorIdentity}
          onChange={(colors) =>
            updateFilter({ colorIdentity: colors.length ? colors : null })
          }
        />
      </AccordionSection>

      <AccordionSection
        label="Archetype"
        preview={hasArchetype ? archetype : null}
        open={openSections.archetype || hasArchetype}
        onToggle={() => toggle('archetype')}
      >
        <Select
          value={archetype || 'all'}
          onValueChange={(v) =>
            updateFilter({ archetype: v === 'all' ? null : v })
          }
        >
          <SelectTrigger className={triggerClass}>
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
      </AccordionSection>

      {/* Reset */}
      <div className="px-3.5 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground w-full text-xs"
          disabled={!hasFilters}
        >
          Reset all filters
        </Button>
      </div>
    </div>
  )
}

// ---------- main sidebar ----------

interface BrowseSidebarProps {
  resultCount: number
  defaultCity?: string | null
  defaultProvince?: string | null
  basePath?: string
  mobileOnly?: boolean
  desktopOnly?: boolean
}

export function BrowseSidebar({
  resultCount,
  defaultCity,
  defaultProvince,
  basePath = '/decks',
  mobileOnly,
  desktopOnly,
}: BrowseSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const hasFilters =
    searchParams.has('format') ||
    searchParams.has('province') ||
    searchParams.has('city') ||
    searchParams.has('commander') ||
    searchParams.has('minValue') ||
    searchParams.has('maxValue') ||
    searchParams.has('powerLevel') ||
    searchParams.has('colorIdentity') ||
    searchParams.has('archetype')

  const updateFilter = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const next = buildParams(searchParams, updates)
      const str = next.toString()
      router.replace(str ? `${basePath}?${str}` : basePath)
    },
    [router, searchParams, basePath],
  )

  function clearFilters() {
    router.replace(basePath)
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

  const isLocal =
    !!defaultProvince && searchParams.get('province') === defaultProvince
  const isCedh = searchParams.get('powerLevel') === 'bracket5'
  const isUnder200 = searchParams.get('maxValue') === '20000'

  const quickChips = (
    <div className="flex flex-wrap gap-1.5">
      {defaultProvince && (
        <QuickChip
          label="Near me"
          active={isLocal}
          onClick={() => toggleQuick({ province: defaultProvince! })}
        />
      )}
      <QuickChip
        label="cEDH"
        active={isCedh}
        onClick={() => toggleQuick({ powerLevel: 'bracket5' })}
      />
      <QuickChip
        label="Under $200"
        active={isUnder200}
        onClick={() => toggleQuick({ maxValue: '20000' })}
      />
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-muted-foreground ml-auto flex items-center gap-1 text-[10px] transition-colors hover:text-white"
          aria-label="Clear all filters"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  )

  if (desktopOnly) {
    return (
      <aside className="hidden w-64 shrink-0 lg:block">
        <div
          className="sticky top-20 overflow-y-auto rounded-2xl border border-white/10 bg-white/[3%] backdrop-blur-xl"
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
          <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
            <h2 className="text-sm font-bold">Filters</h2>
            <span className="text-muted-foreground text-[10px]">
              {resultCount} results
            </span>
          </div>

          <div className="px-3.5 pb-2.5">{quickChips}</div>

          <FilterContent
            searchParams={searchParams}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            hasFilters={hasFilters}
          />
        </div>
      </aside>
    )
  }

  if (mobileOnly) {
    const isListView = searchParams.get('view') === 'list'

    // Build view toggle URL (preserves all other params)
    const viewToggleParams = new URLSearchParams(searchParams.toString())
    if (isListView) {
      viewToggleParams.delete('view')
    } else {
      viewToggleParams.set('view', 'list')
    }
    const viewToggleUrl = viewToggleParams.toString()
      ? `${basePath}?${viewToggleParams.toString()}`
      : basePath

    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto">
          {defaultProvince && (
            <QuickChip
              label="Near me"
              active={isLocal}
              onClick={() => toggleQuick({ province: defaultProvince! })}
            />
          )}
          <QuickChip
            label="cEDH"
            active={isCedh}
            onClick={() => toggleQuick({ powerLevel: 'bracket5' })}
          />
          <QuickChip
            label="Under $200"
            active={isUnder200}
            onClick={() => toggleQuick({ maxValue: '20000' })}
          />
        </div>
        <a
          href={viewToggleUrl}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
            isListView
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-white/10 bg-white/5',
          )}
        >
          {isListView ? 'Grid' : 'List'}
        </a>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasFilters && (
                <span className="bg-primary flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent
                searchParams={searchParams}
                updateFilter={(updates) => {
                  updateFilter(updates)
                }}
                clearFilters={() => {
                  clearFilters()
                  setSheetOpen(false)
                }}
                hasFilters={hasFilters}
                inputSize="h-10"
              />
              <div className="mt-4 pb-4">
                <Button className="w-full" onClick={() => setSheetOpen(false)}>
                  Show {resultCount} result
                  {resultCount !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: sticky bar with chips + filter sheet trigger */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1.5 overflow-x-auto">
            {defaultProvince && (
              <QuickChip
                label="Near me"
                active={isLocal}
                onClick={() => toggleQuick({ province: defaultProvince! })}
              />
            )}
            <QuickChip
              label="cEDH"
              active={isCedh}
              onClick={() => toggleQuick({ powerLevel: 'bracket5' })}
            />
            <QuickChip
              label="Under $200"
              active={isUnder200}
              onClick={() => toggleQuick({ maxValue: '20000' })}
            />
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasFilters && (
                  <span className="bg-primary flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FilterContent
                  searchParams={searchParams}
                  updateFilter={(updates) => {
                    updateFilter(updates)
                  }}
                  clearFilters={() => {
                    clearFilters()
                    setSheetOpen(false)
                  }}
                  hasFilters={hasFilters}
                  inputSize="h-10"
                />
                <div className="mt-4 pb-4">
                  <Button
                    className="w-full"
                    onClick={() => setSheetOpen(false)}
                  >
                    Show {resultCount} result
                    {resultCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop: original sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div
          className="sticky top-20 overflow-y-auto rounded-2xl border border-white/10 bg-white/[3%] backdrop-blur-xl"
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
          <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
            <h2 className="text-sm font-bold">Filters</h2>
            <span className="text-muted-foreground text-[10px]">
              {resultCount} results
            </span>
          </div>

          <div className="px-3.5 pb-2.5">{quickChips}</div>

          <FilterContent
            searchParams={searchParams}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            hasFilters={hasFilters}
          />
        </div>
      </aside>
    </>
  )
}
