'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'

export function HeaderSearch() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    try {
      const res = await fetch(
        `/api/cards/search?q=${encodeURIComponent(q)}&type=commander&limit=8`,
      )
      const data: string[] = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
      setHighlightIndex(-1)
    } catch {
      // ignore fetch errors
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 200)
  }

  function navigate(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/decks?q=${encodeURIComponent(trimmed)}`)
    setValue('')
    setSuggestions([])
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (highlightIndex >= 0 && suggestions[highlightIndex]) {
      navigate(suggestions[highlightIndex])
    } else {
      navigate(value)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden flex-1 justify-center sm:flex"
    >
      <div ref={containerRef} className="relative w-72">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search commanders…"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border py-1.5 pr-3 pl-8 text-sm focus:ring-1 focus:outline-none"
        />
        {open && suggestions.length > 0 && (
          <ul
            className="bg-popover border-border absolute z-50 mt-1 w-full rounded-md border shadow-md"
            role="listbox"
          >
            {suggestions.map((name, i) => (
              <li key={name} role="option" aria-selected={i === highlightIndex}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm ${
                    i === highlightIndex ? 'bg-accent' : 'hover:bg-accent'
                  }`}
                  onMouseDown={() => navigate(name)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  )
}
