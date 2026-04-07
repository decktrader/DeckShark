'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'

interface CommanderAutocompleteProps {
  value: string
  onChange: (value: string) => void
  /** Called with the card's color identity (e.g. ['W','U','B']) when a suggestion is selected */
  onColorIdentity?: (colors: string[]) => void
  id?: string
  placeholder?: string
}

export function CommanderAutocomplete({
  value,
  onChange,
  onColorIdentity,
  id,
  placeholder = "e.g. Atraxa, Praetors' Voice",
}: CommanderAutocompleteProps) {
  const [results, setResults] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}&include_extras=false`,
      )
      if (!res.ok) return
      const data = await res.json()
      setResults((data.data ?? []).slice(0, 8))
      setIsOpen((data.data ?? []).length > 0)
      setActiveIndex(-1)
    } catch {
      // Scryfall unavailable — fail silently, user can type manually
    }
  }, [])

  function handleChange(v: string) {
    onChange(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 250)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSelect(name: string) {
    onChange(name)
    setResults([])
    setIsOpen(false)

    // Fetch color identity from Scryfall
    if (onColorIdentity) {
      try {
        const res = await fetch(
          `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
        )
        if (res.ok) {
          const card = await res.json()
          if (card.color_identity) {
            onColorIdentity(card.color_identity)
          }
        }
      } catch {
        // Non-critical — user can set colors manually
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && (
        <ul className="bg-popover border-border absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border shadow-md">
          {results.map((name, i) => (
            <li
              key={name}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onMouseDown={() => handleSelect(name)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
