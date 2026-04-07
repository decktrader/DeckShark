'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRightLeft,
  MessageSquare,
  ChevronLeft,
  DollarSign,
  Check,
  X,
} from 'lucide-react'

const THEM = { username: 'hammerhead', city: 'Vancouver', province: 'BC' }
const MY_DECKS = [
  {
    name: 'Arcades, When the Walls Fell',
    value: '$134.40',
    art: 'https://cards.scryfall.io/art_crop/front/0/6/0652f9e2-ba2a-4c0a-bbfc-9b00ee5d28d4.jpg',
    commander: 'Arcades, the Strategist',
  },
]
const THEIR_DECKS = [
  { name: 'Charm Enchantress', value: '$89.00', art: null, commander: null },
]
const CASH = '$45.40 (they pay)'
const MESSAGE = 'How strong are walls? Wood or concrete?'

function DeckRow({
  d,
}: {
  d: {
    name: string
    value: string
    art: string | null
    commander: string | null
  }
}) {
  return (
    <div className="flex items-center gap-4">
      {d.art ? (
        <img src={d.art} alt="" className="h-14 w-20 rounded-lg object-cover" />
      ) : (
        <div className="bg-muted h-14 w-20 rounded-lg" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{d.name}</p>
        {d.commander && (
          <p className="text-muted-foreground text-xs">{d.commander}</p>
        )}
      </div>
      <p className="text-primary shrink-0 font-bold">{d.value}</p>
    </div>
  )
}

// ─── V3A: Original V3 — stacked cards, frosted header, separate sections ─────
function V3A() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href="#"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="h-4 w-4" /> All trades
      </Link>

      <div className="mb-6 rounded-2xl border border-white/5 bg-white/[2%] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white">
              H
            </div>
            <div>
              <h1 className="text-xl font-bold">Trade with {THEM.username}</h1>
              <p className="text-muted-foreground text-sm">
                {THEM.city}, {THEM.province}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
            Proposed
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              You&apos;re offering
            </h2>
            {MY_DECKS.map((d) => (
              <DeckRow key={d.name} d={d} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              You&apos;d receive
            </h2>
            {THEIR_DECKS.map((d) => (
              <DeckRow key={d.name} d={d} />
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[2%] px-4 py-3">
          <DollarSign className="text-muted-foreground h-4 w-4" />
          <p className="text-sm">{CASH}</p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-semibold">{THEM.username}</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {MESSAGE}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button className="flex-1">Accept trade</Button>
          <Button variant="outline" className="flex-1">
            Counter-offer
          </Button>
          <Button variant="destructive">Decline</Button>
        </div>
      </div>
    </main>
  )
}

// ─── V3B: Single card with dividers instead of separate cards ────────────────
function V3B() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href="#"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="h-4 w-4" /> All trades
      </Link>

      <div className="mb-6 rounded-2xl border border-white/5 bg-white/[2%] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white">
              H
            </div>
            <div>
              <h1 className="text-xl font-bold">Trade with {THEM.username}</h1>
              <p className="text-muted-foreground text-sm">
                {THEM.city}, {THEM.province}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
            Proposed
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {/* Your offer */}
          <div className="p-5">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              You&apos;re offering
            </h2>
            <div className="space-y-3">
              {MY_DECKS.map((d) => (
                <DeckRow key={d.name} d={d} />
              ))}
            </div>
          </div>

          {/* Their offer */}
          <div className="p-5">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              You&apos;d receive
            </h2>
            <div className="space-y-3">
              {THEIR_DECKS.map((d) => (
                <DeckRow key={d.name} d={d} />
              ))}
            </div>
          </div>

          {/* Cash */}
          <div className="flex items-center gap-3 bg-white/[2%] px-5 py-3">
            <DollarSign className="text-muted-foreground h-4 w-4" />
            <p className="text-sm">{CASH}</p>
          </div>

          {/* Message */}
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                H
              </div>
              <div>
                <p className="text-xs font-semibold">{THEM.username}</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {MESSAGE}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-5">
            <Button className="flex-1 gap-2">
              <Check className="h-4 w-4" /> Accept
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <ArrowRightLeft className="h-4 w-4" /> Counter
            </Button>
            <Button variant="destructive" className="gap-2">
              <X className="h-4 w-4" /> Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

// ─── V3C: Header with deck art peek, larger deck previews ────────────────────
function V3C() {
  const heroArt = MY_DECKS[0]?.art
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href="#"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="h-4 w-4" /> All trades
      </Link>

      {/* Header with art peek */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/5">
        {heroArt && (
          <>
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-30 blur-2xl"
              style={{ backgroundImage: `url(${heroArt})` }}
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        <div className="relative flex items-start justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-white/10">
              H
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                Trade with {THEM.username}
              </h1>
              <p className="text-sm text-white/60">
                {THEM.city}, {THEM.province}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-semibold text-yellow-400 backdrop-blur-sm">
            Proposed
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Your offer — larger art */}
        <Card>
          <CardContent className="pt-4">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              You&apos;re offering
            </h2>
            {MY_DECKS.map((d) => (
              <div key={d.name} className="flex items-center gap-4">
                {d.art ? (
                  <img
                    src={d.art}
                    alt=""
                    className="h-20 w-28 rounded-xl object-cover"
                  />
                ) : (
                  <div className="bg-muted h-20 w-28 rounded-xl" />
                )}
                <div className="flex-1">
                  <p className="text-lg font-semibold">{d.name}</p>
                  {d.commander && (
                    <p className="text-muted-foreground text-sm">
                      {d.commander}
                    </p>
                  )}
                  <p className="text-primary mt-1 text-lg font-bold">
                    {d.value}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowRightLeft className="text-muted-foreground h-5 w-5" />
          </div>
        </div>

        {/* Their offer — larger art */}
        <Card>
          <CardContent className="pt-4">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              You&apos;d receive
            </h2>
            {THEIR_DECKS.map((d) => (
              <div key={d.name} className="flex items-center gap-4">
                {d.art ? (
                  <img
                    src={d.art}
                    alt=""
                    className="h-20 w-28 rounded-xl object-cover"
                  />
                ) : (
                  <div className="bg-muted h-20 w-28 rounded-xl" />
                )}
                <div className="flex-1">
                  <p className="text-lg font-semibold">{d.name}</p>
                  {d.commander && (
                    <p className="text-muted-foreground text-sm">
                      {d.commander}
                    </p>
                  )}
                  <p className="text-primary mt-1 text-lg font-bold">
                    {d.value}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cash */}
        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[2%] px-4 py-3">
          <DollarSign className="text-muted-foreground h-4 w-4" />
          <p className="text-sm">{CASH}</p>
        </div>

        {/* Message */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                H
              </div>
              <div>
                <p className="text-sm font-semibold">{THEM.username}</p>
                <p className="text-muted-foreground mt-0.5">{MESSAGE}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button className="flex-1" size="lg">
            Accept trade
          </Button>
          <Button variant="outline" className="flex-1" size="lg">
            Counter-offer
          </Button>
          <Button variant="destructive" size="lg">
            Decline
          </Button>
        </div>
      </div>
    </main>
  )
}

// ─── V3D: Compact header, two-col decks inside one card, sticky actions ──────
function V3D() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href="#"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="h-4 w-4" /> All trades
      </Link>

      {/* Compact header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
            H
          </div>
          <div>
            <h1 className="text-lg font-bold">Trade with {THEM.username}</h1>
            <p className="text-muted-foreground text-xs">
              {THEM.city}, {THEM.province}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
          Proposed
        </span>
      </div>

      {/* Two-column decks in one card */}
      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 divide-x divide-white/5">
            <div className="p-5">
              <p className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-widest uppercase">
                You offer
              </p>
              {MY_DECKS.map((d) => (
                <div key={d.name}>
                  {d.art && (
                    <img
                      src={d.art}
                      alt=""
                      className="mb-2 aspect-[5/3] w-full rounded-lg object-cover"
                    />
                  )}
                  <p className="text-sm font-semibold">{d.name}</p>
                  {d.commander && (
                    <p className="text-muted-foreground text-xs">
                      {d.commander}
                    </p>
                  )}
                  <p className="text-primary mt-1 font-bold">{d.value}</p>
                </div>
              ))}
            </div>
            <div className="p-5">
              <p className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-widest uppercase">
                You receive
              </p>
              {THEIR_DECKS.map((d) => (
                <div key={d.name}>
                  {d.art ? (
                    <img
                      src={d.art}
                      alt=""
                      className="mb-2 aspect-[5/3] w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="bg-muted mb-2 aspect-[5/3] w-full rounded-lg" />
                  )}
                  <p className="text-sm font-semibold">{d.name}</p>
                  <p className="text-primary mt-1 font-bold">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash + message */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[2%] px-4 py-3">
          <DollarSign className="text-muted-foreground h-4 w-4" />
          <p className="text-sm">{CASH}</p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                H
              </div>
              <div>
                <p className="text-xs font-semibold">{THEM.username}</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {MESSAGE}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky actions */}
      <div className="sticky bottom-4 flex gap-3 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl">
        <Button className="flex-1 gap-2">
          <Check className="h-4 w-4" /> Accept
        </Button>
        <Button variant="outline" className="flex-1 gap-2">
          <ArrowRightLeft className="h-4 w-4" /> Counter
        </Button>
        <Button variant="destructive" className="gap-2">
          <X className="h-4 w-4" /> Decline
        </Button>
      </div>
    </main>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TradeDetailPreview() {
  const [version, setVersion] = useState('v3a')

  return (
    <div>
      <div className="border-b-4 border-purple-500/30">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <h2 className="text-lg font-bold">
            Trade Detail V3 — Design Preview
          </h2>
          <div className="flex gap-2">
            {['v3a', 'v3b', 'v3c', 'v3d'].map((v) => (
              <button
                key={v}
                onClick={() => setVersion(v)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  version === v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="text-muted-foreground container mx-auto px-4 pb-3 text-sm">
          {version === 'v3a' &&
            'V3A: Original — frosted header card, separate cards per section, inline cash bar, action buttons below.'}
          {version === 'v3b' &&
            'V3B: Single card with dividers — all sections inside one card (offer/receive/cash/message/actions), avatar in message.'}
          {version === 'v3c' &&
            'V3C: Blurred art header, larger deck art previews, centered swap icon between sections, larger action buttons.'}
          {version === 'v3d' &&
            'V3D: Compact inline header, two-column deck comparison card, sticky floating action bar at bottom with backdrop blur.'}
        </div>
      </div>

      {version === 'v3a' && <V3A />}
      {version === 'v3b' && <V3B />}
      {version === 'v3c' && <V3C />}
      {version === 'v3d' && <V3D />}
    </div>
  )
}
