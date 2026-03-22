'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchCards } from '@/lib/services/cards'
import type { CardCache } from '@/types'
import { Input } from '@/components/ui/input'

interface CardAutocompleteProps {
  onSelect: (card: CardCache) => void
  placeholder?: string
}

export function CardAutocomplete({
  onSelect,
  placeholder = 'Search for a card...',
}: CardAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CardCache[]>([])
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
    const { data } = await searchCards(q, 10)
    if (data) {
      setResults(data)
      setIsOpen(data.length > 0)
      setActiveIndex(-1)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 200)
  }

  // Clean up debounce on unmount
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

  function handleSelect(card: CardCache) {
    onSelect(card)
    setQuery('')
    setResults([])
    setIsOpen(false)
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

  function formatPrice(cents: number | null): string {
    if (cents === null) return ''
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && (
        <ul className="bg-popover border-border absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border shadow-md">
          {results.map((card, i) => (
            <li
              key={card.scryfall_id}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                i === activeIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onMouseDown={() => handleSelect(card)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <div className="flex items-center gap-2">
                {card.mana_cost && (
                  <span className="text-muted-foreground text-xs">
                    {card.mana_cost}
                  </span>
                )}
                <span>{card.name}</span>
              </div>
              {card.price_usd_cents !== null && (
                <span className="text-muted-foreground text-xs">
                  {formatPrice(card.price_usd_cents)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
