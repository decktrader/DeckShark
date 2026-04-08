'use client'

import { useState } from 'react'
import { DeckArt } from '@/components/deck/deck-art'
import { Switch } from '@/components/ui/switch'

const MOCK_DECKS = [
  {
    id: '1',
    name: 'Ishai and Jeska',
    commander_name: 'Ishai, Ojutai Dragonspeaker',
    partner_commander_name: 'Jeska, Thrice Reborn',
    commander_scryfall_id: 'b94f73fc-23e7-46d5-a729-60b11e8e1b5d',
    partner_commander_scryfall_id: '7b1803e4-1060-4064-b2a4-68760777e97b',
    format: 'Commander',
    estimated_value_cents: 14500,
    available_for_trade: false,
  },
  {
    id: '2',
    name: 'Atraxa Superfriends',
    commander_name: "Atraxa, Praetors' Voice",
    partner_commander_name: null,
    commander_scryfall_id: 'a3e61b84-b9a2-4722-9d08-7a1bc587c110',
    partner_commander_scryfall_id: null,
    format: 'Commander',
    estimated_value_cents: 45000,
    available_for_trade: false,
  },
  {
    id: '3',
    name: 'Krenko Goblins',
    commander_name: 'Krenko, Mob Boss',
    partner_commander_name: null,
    commander_scryfall_id: '36c1e71a-b4f5-4413-a613-0e59c4062f53',
    partner_commander_scryfall_id: null,
    format: 'Commander',
    estimated_value_cents: 8500,
    available_for_trade: true,
  },
]

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(0)}`
}

function commanderLabel(deck: (typeof MOCK_DECKS)[0]) {
  return [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')
}

// Shared art + overlay section
function CardArt({ deck }: { deck: (typeof MOCK_DECKS)[0] }) {
  return (
    <div className="relative">
      <DeckArt
        commanderScryfallId={deck.commander_scryfall_id}
        partnerScryfallId={deck.partner_commander_scryfall_id}
        className="transition-transform duration-500 group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="truncate text-sm font-bold text-white drop-shadow-lg">
          {deck.name}
        </p>
        <p className="truncate text-xs text-white/50">{commanderLabel(deck)}</p>
      </div>
    </div>
  )
}

// ─── V2A: Status label + toggle, larger price ───
function DeckCardV2A({ deck }: { deck: (typeof MOCK_DECKS)[0] }) {
  const [available, setAvailable] = useState(deck.available_for_trade)
  return (
    <div className="group overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
      <CardArt deck={deck} />
      <div className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs capitalize">
            {deck.format}
          </span>
          <span className="text-lg font-bold text-emerald-400">
            {formatPrice(deck.estimated_value_cents)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-medium ${available ? 'text-emerald-400' : 'text-muted-foreground'}`}
          >
            {available ? 'For trade' : 'Not listed'}
          </span>
          <Switch
            checked={available}
            onCheckedChange={setAvailable}
            className="scale-75"
          />
        </div>
      </div>
    </div>
  )
}

// ─── V2B: Dot separator between format and price, colored status dot ───
function DeckCardV2B({ deck }: { deck: (typeof MOCK_DECKS)[0] }) {
  const [available, setAvailable] = useState(deck.available_for_trade)
  return (
    <div className="group overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
      <CardArt deck={deck} />
      <div className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs capitalize">
            {deck.format}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-lg font-bold text-emerald-400">
            {formatPrice(deck.estimated_value_cents)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${available ? 'bg-emerald-400' : 'bg-zinc-600'}`}
          />
          <Switch
            checked={available}
            onCheckedChange={setAvailable}
            className="scale-75"
          />
        </div>
      </div>
    </div>
  )
}

// ─── V2C: Format badge pill, price prominent, toggle with label below ───
function DeckCardV2C({ deck }: { deck: (typeof MOCK_DECKS)[0] }) {
  const [available, setAvailable] = useState(deck.available_for_trade)
  return (
    <div className="group overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
      <CardArt deck={deck} />
      <div className="border-t border-white/5 bg-white/[3%] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60 capitalize">
              {deck.format}
            </span>
            <span className="text-lg font-bold text-emerald-400">
              {formatPrice(deck.estimated_value_cents)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] ${available ? 'text-emerald-400' : 'text-muted-foreground'}`}
            >
              {available ? 'Trading' : 'Private'}
            </span>
            <Switch
              checked={available}
              onCheckedChange={setAvailable}
              className="scale-75"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── V2D: Price left-aligned big, format small above, toggle far right ───
function DeckCardV2D({ deck }: { deck: (typeof MOCK_DECKS)[0] }) {
  const [available, setAvailable] = useState(deck.available_for_trade)
  return (
    <div className="group overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
      <CardArt deck={deck} />
      <div className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-3 py-2">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
            {deck.format}
          </span>
          <span className="text-lg leading-tight font-bold text-emerald-400">
            {formatPrice(deck.estimated_value_cents)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <Switch
            checked={available}
            onCheckedChange={setAvailable}
            className="scale-75"
          />
          <span
            className={`text-[10px] ${available ? 'text-emerald-400' : 'text-muted-foreground'}`}
          >
            {available ? 'For trade' : 'Not listed'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DeckCardPreview() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] px-8 py-12">
      <h1 className="mb-2 text-2xl font-bold text-white">
        Deck Card — V2 Sub-Variants (with V1 price)
      </h1>
      <p className="text-muted-foreground mb-10 text-sm">
        All use the larger emerald price from V1 + toggle switch. 4 layout
        variations.
      </p>

      {/* V2A */}
      <section className="mb-12">
        <h2 className="mb-1 text-lg font-semibold text-white">
          V2A — Status label + toggle, large price
        </h2>
        <p className="text-muted-foreground mb-4 text-xs">
          &quot;For trade&quot; / &quot;Not listed&quot; label changes color
          when active, big emerald price
        </p>
        <div className="grid max-w-4xl grid-cols-3 gap-4">
          {MOCK_DECKS.map((d) => (
            <DeckCardV2A key={d.id} deck={d} />
          ))}
        </div>
      </section>

      {/* V2B */}
      <section className="mb-12">
        <h2 className="mb-1 text-lg font-semibold text-white">
          V2B — Dot separator, colored status dot
        </h2>
        <p className="text-muted-foreground mb-4 text-xs">
          Format &middot; price on left, green/gray dot indicator next to toggle
        </p>
        <div className="grid max-w-4xl grid-cols-3 gap-4">
          {MOCK_DECKS.map((d) => (
            <DeckCardV2B key={d.id} deck={d} />
          ))}
        </div>
      </section>

      {/* V2C */}
      <section className="mb-12">
        <h2 className="mb-1 text-lg font-semibold text-white">
          V2C — Format badge pill, &quot;Trading&quot; / &quot;Private&quot;
          label
        </h2>
        <p className="text-muted-foreground mb-4 text-xs">
          Format in a rounded pill, different status wording
        </p>
        <div className="grid max-w-4xl grid-cols-3 gap-4">
          {MOCK_DECKS.map((d) => (
            <DeckCardV2C key={d.id} deck={d} />
          ))}
        </div>
      </section>

      {/* V2D */}
      <section className="mb-12">
        <h2 className="mb-1 text-lg font-semibold text-white">
          V2D — Stacked: format above price, toggle with label below
        </h2>
        <p className="text-muted-foreground mb-4 text-xs">
          Two-line left (uppercase format, big price below), two-line right
          (toggle, status below)
        </p>
        <div className="grid max-w-4xl grid-cols-3 gap-4">
          {MOCK_DECKS.map((d) => (
            <DeckCardV2D key={d.id} deck={d} />
          ))}
        </div>
      </section>
    </div>
  )
}
