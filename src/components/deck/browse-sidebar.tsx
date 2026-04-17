'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
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
  PROVINCES,
  ARCHETYPES,
  POWER_LEVELS,
  SORT_OPTIONS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { X, SlidersHorizontal } from 'lucide-react'

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

function GlassDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  )
}

function SidebarSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-2.5 text-[10px] font-bold tracking-widest uppercase">
        {label}
      </p>
      {children}
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
  const sortBy = searchParams.get('sortBy') ?? ''
  const format = searchParams.get('format') ?? ''
  const province = searchParams.get('province') ?? ''

  const triggerClass = `${inputSize} border-white/10 bg-white/5 text-xs`

  return (
    <div className="space-y-5">
      {/* Price range */}
      <SidebarSection label="Price range">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min $"
            className={`${triggerClass}`}
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
          <span className="text-muted-foreground text-xs">—</span>
          <Input
            type="number"
            min={0}
            placeholder="Max $"
            className={`${triggerClass}`}
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
      </SidebarSection>

      <GlassDivider />

      {/* Location */}
      <SidebarSection label="Location">
        <div className="space-y-1.5">
          <Select
            value={province || 'all'}
            onValueChange={(v) =>
              updateFilter({ province: v === 'all' ? null : v })
            }
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="All provinces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All provinces</SelectItem>
              {PROVINCES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CityAutocomplete
            key={searchParams.get('city') ?? 'empty'}
            defaultValue={searchParams.get('city') ?? ''}
            onCommit={(v) => updateFilter({ city: v || null })}
            placeholder="City"
          />
        </div>
      </SidebarSection>

      <GlassDivider />

      {/* Format */}
      <SidebarSection label="Format">
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
      </SidebarSection>

      <GlassDivider />

      {/* Commander */}
      <SidebarSection label="Commander">
        <CommanderAutocomplete
          key={searchParams.get('commander') ?? 'empty'}
          defaultValue={searchParams.get('commander') ?? ''}
          onCommit={(v) => updateFilter({ commander: v || null })}
          placeholder="e.g. Atraxa"
        />
      </SidebarSection>

      <GlassDivider />

      {/* Power level */}
      <SidebarSection label="Power level">
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
      </SidebarSection>

      <GlassDivider />

      {/* Color identity */}
      <SidebarSection label="Color identity">
        <ColorIdentitySelector
          value={colorIdentity}
          onChange={(colors) =>
            updateFilter({ colorIdentity: colors.length ? colors : null })
          }
        />
      </SidebarSection>

      <GlassDivider />

      {/* Archetype */}
      <SidebarSection label="Archetype">
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
      </SidebarSection>

      <GlassDivider />

      {/* Sort */}
      <SidebarSection label="Sort by">
        <Select
          value={sortBy || 'recent'}
          onValueChange={(v) =>
            updateFilter({ sortBy: v === 'recent' ? null : v })
          }
        >
          <SelectTrigger className={triggerClass}>
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
      </SidebarSection>

      {/* Reset */}
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
    searchParams.has('archetype') ||
    searchParams.has('sortBy')

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
          className="sticky top-20 space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-white/[3%] p-5 backdrop-blur-xl"
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Filters</h2>
            <span className="text-muted-foreground text-[10px]">
              {resultCount} results
            </span>
          </div>

          {quickChips}

          <GlassDivider />

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
          className="sticky top-20 space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-white/[3%] p-5 backdrop-blur-xl"
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Filters</h2>
            <span className="text-muted-foreground text-[10px]">
              {resultCount} results
            </span>
          </div>

          {quickChips}

          <GlassDivider />

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
