'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FORMATS, PROVINCES } from '@/lib/constants'

export function BrowseFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.replace(`/decks?${params.toString()}`)
    },
    [router, searchParams],
  )

  function clearFilters() {
    router.replace('/decks')
  }

  const hasFilters =
    searchParams.has('format') ||
    searchParams.has('province') ||
    searchParams.has('city') ||
    searchParams.has('commander') ||
    searchParams.has('minValue') ||
    searchParams.has('maxValue')

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="format-filter">Format</Label>
          <Select
            value={searchParams.get('format') ?? ''}
            onValueChange={(v) => updateFilter('format', v === 'all' ? '' : v)}
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

        <div className="space-y-1">
          <Label htmlFor="province-filter">Province</Label>
          <Select
            value={searchParams.get('province') ?? ''}
            onValueChange={(v) =>
              updateFilter('province', v === 'all' ? '' : v)
            }
          >
            <SelectTrigger id="province-filter">
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
        </div>

        <div className="space-y-1">
          <Label htmlFor="city-filter">City</Label>
          <Input
            id="city-filter"
            placeholder="e.g. Vancouver"
            defaultValue={searchParams.get('city') ?? ''}
            onBlur={(e) => updateFilter('city', e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter('city', e.currentTarget.value.trim())
              }
            }}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="commander-filter">Commander</Label>
          <Input
            id="commander-filter"
            placeholder="e.g. Atraxa"
            defaultValue={searchParams.get('commander') ?? ''}
            onBlur={(e) => updateFilter('commander', e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter('commander', e.currentTarget.value.trim())
              }
            }}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="min-value-filter">Min value ($)</Label>
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
              updateFilter(
                'minValue',
                isNaN(dollars) ? '' : String(Math.round(dollars * 100)),
              )
            }}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="max-value-filter">Max value ($)</Label>
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
              updateFilter(
                'maxValue',
                isNaN(dollars) ? '' : String(Math.round(dollars * 100)),
              )
            }}
          />
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
