'use client'

import { useState, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'

interface CityAutocompleteProps {
  defaultValue?: string
  onCommit: (value: string) => void
  id?: string
  placeholder?: string
}

export function CityAutocomplete({
  defaultValue = '',
  onCommit,
  id,
  placeholder = 'e.g. Vancouver',
}: CityAutocompleteProps) {
  const [inputVal, setInputVal] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    try {
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}`)
      const data: string[] = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
    } catch {
      // ignore fetch errors in autocomplete
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setInputVal(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  function handleSelect(name: string) {
    setInputVal(name)
    onCommit(name)
    setOpen(false)
    setSuggestions([])
  }

  function handleBlur() {
    setTimeout(() => {
      setOpen(false)
      onCommit(inputVal.trim())
    }, 150)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setOpen(false)
      onCommit(inputVal.trim())
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={inputVal}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      {open && suggestions.length > 0 && (
        <ul
          className="bg-popover border-border absolute z-20 mt-1 w-full rounded-md border shadow-md"
          role="listbox"
          aria-label="City suggestions"
        >
          {suggestions.map((name) => (
            <li key={name} role="option" aria-selected={inputVal === name}>
              <button
                type="button"
                className="hover:bg-accent w-full px-3 py-2 text-left text-sm"
                onMouseDown={() => handleSelect(name)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
