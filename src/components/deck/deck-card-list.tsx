'use client'

import { useState, createContext, useContext } from 'react'
import type { DeckCard } from '@/types'
import { formatPrice } from '@/lib/utils'

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
  const { hoveredCard, setHoveredCard } = useContext(HoveredCardContext)

  return (
    <div className="pb-2">
      {commanders.length > 0 && (
        <CardGroup
          title="Commander"
          cards={commanders}
          hoveredId={hoveredCard?.id}
          onHover={setHoveredCard}
        />
      )}
      <CardGroup
        title={commanders.length > 0 ? 'Deck' : undefined}
        cards={nonCommanders}
        hoveredId={hoveredCard?.id}
        onHover={setHoveredCard}
      />
    </div>
  )
}

function CardGroup({
  title,
  cards,
  hoveredId,
  onHover,
}: {
  title?: string
  cards: DeckCard[]
  hoveredId?: string
  onHover: (card: DeckCard) => void
}) {
  if (cards.length === 0) return null
  return (
    <div className="px-[18px] pt-[13px] pb-1">
      {title && (
        <div className="text-brass-deep mb-1.5 font-mono text-[10.5px] font-semibold tracking-[0.1em] uppercase">
          {title}
        </div>
      )}
      <ul>
        {cards.map((card) => (
          <CardRow
            key={card.id}
            card={card}
            isHovered={hoveredId === card.id}
            onHover={onHover}
          />
        ))}
      </ul>
    </div>
  )
}

export function DeckCardPreview() {
  const { hoveredCard } = useContext(HoveredCardContext)

  if (!hoveredCard?.scryfall_id) {
    return (
      <div className="rounded-card border-line bg-board flex aspect-[488/680] w-full items-center justify-center border">
        <p className="text-paper/50 text-xs">Hover a card to preview</p>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Scryfall card preview swaps on hover; next/image adds no value here
    <img
      src={scryfallCardUrl(hoveredCard.scryfall_id)}
      alt={hoveredCard.card_name}
      className="rounded-card border-line shadow-card w-full border transition-all duration-200"
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
      className={`flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors ${
        isHovered ? 'bg-paper-2' : ''
      }`}
      onMouseEnter={() => onHover(card)}
    >
      <span className="text-slate w-6 shrink-0 font-mono text-xs">
        {card.quantity}x
      </span>
      <span className="text-ink flex-1 text-[13.5px]">{card.card_name}</span>
      <span className="text-ink-2 font-mono text-xs">
        {card.price_cents ? formatPrice(card.price_cents) : '–'}
      </span>
    </li>
  )
}
