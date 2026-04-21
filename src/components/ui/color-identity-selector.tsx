'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COLOR_IDENTITY_OPTIONS } from '@/lib/constants'

// WUBRG canonical order for normalising incoming arrays
const WUBRG = ['W', 'U', 'B', 'R', 'G']

function toKey(colors: string[]): string {
  return [...colors]
    .sort((a, b) => WUBRG.indexOf(a) - WUBRG.indexOf(b))
    .join('')
}

interface ColorIdentitySelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

const CATEGORY_VALUES = ['_mono', '_dual', '_tri', '_four'] as const

export function ColorIdentitySelector({
  value,
  onChange,
}: ColorIdentitySelectorProps) {
  // Category values are stored as a single-element array like ['_mono']
  const isCategory =
    value.length === 1 &&
    CATEGORY_VALUES.includes(value[0] as (typeof CATEGORY_VALUES)[number])
  const selectValue = isCategory
    ? value[0]
    : value.length
      ? toKey(value) || 'none'
      : 'none'

  function handleChange(v: string) {
    if (v === 'none') {
      onChange([])
      return
    }
    if (CATEGORY_VALUES.includes(v as (typeof CATEGORY_VALUES)[number])) {
      onChange([v])
      return
    }
    const option = COLOR_IDENTITY_OPTIONS.find((o) => o.value === v)
    if (option) onChange([...option.colors])
  }

  return (
    <Select value={selectValue} onValueChange={handleChange}>
      <SelectTrigger aria-label="Color identity">
        <SelectValue placeholder="Any color identity" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectItem value="none">Any color identity</SelectItem>

        <SelectGroup>
          <SelectLabel>By count</SelectLabel>
          <SelectItem value="_mono">Any mono-color</SelectItem>
          <SelectItem value="_dual">Any two-color</SelectItem>
          <SelectItem value="_tri">Any three-color</SelectItem>
          <SelectItem value="_four">Any four-color</SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Mono</SelectLabel>
          {COLOR_IDENTITY_OPTIONS.slice(0, 5).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Dual</SelectLabel>
          {COLOR_IDENTITY_OPTIONS.slice(5, 15).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Tri</SelectLabel>
          {COLOR_IDENTITY_OPTIONS.slice(15, 25).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Four-color</SelectLabel>
          {COLOR_IDENTITY_OPTIONS.slice(25, 30).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Five-color</SelectLabel>
          {COLOR_IDENTITY_OPTIONS.slice(30).map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
