'use client'

import { useState, createContext, useContext } from 'react'
import type { DeckCard } from '@/types'

function formatPrice(cents: number | null): string {
  if (cents === null) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

function scryfallCardUrl(scryfallId: string): string {
  return `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
}

// Context so the preview panel can live anywhere in the tree
const HoveredCardContext = createContext<{
  hoveredCard: DeckCard | null
  setHoveredCard: (card: DeckCard) => void
}>({ hoveredCard: null, setHoveredCard: () => {} })

export function DeckCardListProvider({
  cards,
  children,
}: {
  cards: DeckCard[]
  children: React.ReactNode
}) {
  const commanders = cards.filter((c) => c.is_commander)
  const defaultCard = commanders[0] ?? cards[0] ?? null
  const [hoveredCard, setHoveredCard] = useState<DeckCard | null>(defaultCard)

  return (
    <HoveredCardContext.Provider value={{ hoveredCard, setHoveredCard }}>
      {children}
    </HoveredCardContext.Provider>
  )
}

export function DeckCardList({ cards }: { cards: DeckCard[] }) {
  const commanders = cards.filter((c) => c.is_commander)
  const nonCommanders = cards.filter((c) => !c.is_commander)
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const { hoveredCard, setHoveredCard } = useContext(HoveredCardContext)

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{totalCards} cards</p>
      {commanders.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Commander</h3>
          <ul className="space-y-1">
            {commanders.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                isHovered={hoveredCard?.id === card.id}
                onHover={setHoveredCard}
              />
            ))}
          </ul>
        </div>
      )}
      <div>
        {commanders.length > 0 && (
          <h3 className="mb-2 text-sm font-semibold">Deck</h3>
        )}
        <ul className="space-y-1">
          {nonCommanders.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              isHovered={hoveredCard?.id === card.id}
              onHover={setHoveredCard}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

export function DeckCardPreview() {
  const { hoveredCard } = useContext(HoveredCardContext)

  if (!hoveredCard?.scryfall_id) {
    return (
      <div className="bg-muted/30 flex aspect-[2.5/3.5] w-full items-center justify-center rounded-xl border border-white/5">
        <p className="text-muted-foreground text-xs">Hover a card to preview</p>
      </div>
    )
  }

  return (
    <img
      src={scryfallCardUrl(hoveredCard.scryfall_id)}
      alt={hoveredCard.card_name}
      className="w-full rounded-xl shadow-2xl shadow-black/50 transition-all duration-200"
    />
  )
}

function CardRow({
  card,
  isHovered,
  onHover,
}: {
  card: DeckCard
  isHovered: boolean
  onHover: (card: DeckCard) => void
}) {
  return (
    <li
      className={`flex cursor-default items-center justify-between rounded px-1.5 py-0.5 text-sm transition-colors ${
        isHovered ? 'bg-white/5' : ''
      }`}
      onMouseEnter={() => onHover(card)}
    >
      <span>
        <span className="text-muted-foreground">{card.quantity}x</span>{' '}
        {card.card_name}
      </span>
      <span className="text-muted-foreground text-xs">
        {formatPrice(card.price_cents)}
      </span>
    </li>
  )
}
