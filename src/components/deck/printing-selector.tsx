'use client'

import { useState, useEffect } from 'react'
import { getCardPrintings, getCardsByIds } from '@/lib/services/cards'
import type { CardCache, DeckCard } from '@/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function formatPrice(cents: number | null): string {
  if (!cents) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export function PrintingSelector({
  card,
  onSelect,
}: {
  card: DeckCard
  onSelect: (printing: CardCache) => void
}) {
  const [printings, setPrintings] = useState<CardCache[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || printings.length > 0) return

    async function loadPrintings() {
      if (!card.scryfall_id) return
      setLoading(true)

      // Get oracle_id from current card's scryfall_id
      const { data: cards } = await getCardsByIds([card.scryfall_id])
      const oracleId = cards?.[0]?.oracle_id
      if (!oracleId) {
        setLoading(false)
        return
      }

      const { data } = await getCardPrintings(oracleId)
      if (data) setPrintings(data)
      setLoading(false)
    }

    loadPrintings()
  }, [open, card.scryfall_id, printings.length])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-auto px-1.5 py-0.5 text-xs"
        >
          Change printing
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-72 w-72 overflow-y-auto"
      >
        {loading && (
          <div className="text-muted-foreground p-2 text-center text-xs">
            Loading printings...
          </div>
        )}
        {!loading && printings.length === 0 && (
          <div className="text-muted-foreground p-2 text-center text-xs">
            No printings found
          </div>
        )}
        {printings.map((printing) => (
          <DropdownMenuItem
            key={printing.scryfall_id}
            className="flex items-center justify-between gap-2"
            onClick={() => {
              onSelect(printing)
              setOpen(false)
            }}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="bg-muted rounded px-1 py-0.5 font-mono text-[10px] uppercase">
                {printing.set_code}
              </span>
              <span className="truncate text-xs">
                {printing.set_name ?? printing.set_code}
              </span>
              {printing.collector_number && (
                <span className="text-muted-foreground text-[10px]">
                  #{printing.collector_number}
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs font-medium">
              {formatPrice(printing.price_usd_cents)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
