import Link from 'next/link'
import type { Metadata } from 'next'
import { getPublicDecks } from '@/lib/services/decks.server'
import { PublicDeckCard } from '@/components/deck/public-deck-card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'DeckTrader — Trade MTG Decks Near You',
  description:
    'Find local Magic: The Gathering players and trade decks in person. Browse trade-available decks across Canada.',
  openGraph: {
    title: 'DeckTrader — Trade MTG Decks Near You',
    description:
      'Find local Magic: The Gathering players and trade decks in person. Browse trade-available decks across Canada.',
    type: 'website',
  },
}

const VALUE_PROPS = [
  {
    icon: '🗂️',
    title: 'Manage your collection',
    description:
      'Import decks from Moxfield or Archidekt. Track value, format, and condition in one place.',
  },
  {
    icon: '📍',
    title: 'Find local traders',
    description:
      'Browse decks available for trade in your city and province. No shipping — meet up in person.',
  },
  {
    icon: '🤝',
    title: 'Trade with confidence',
    description:
      'Propose trades, share contact info securely, and build your reputation with post-trade reviews.',
  },
]

function scryfallArtUrl(scryfallId: string) {
  return `https://cards.scryfall.io/art_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
}

export default async function HomePage() {
  const { data: featuredDecks } = await getPublicDecks({ limit: 6 })

  const artDecks = (featuredDecks ?? [])
    .filter((d) => d.commander_scryfall_id)
    .slice(0, 5)

  const mid = Math.floor(artDecks.length / 2)

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        {/* Commander art fan */}
        {artDecks.length >= 3 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {artDecks.map((deck, i) => {
              const offset = i - mid
              return (
                <div
                  key={deck.id}
                  className="absolute h-64 w-44 flex-shrink-0 rounded-xl shadow-2xl"
                  style={{
                    backgroundImage: `url(${scryfallArtUrl(deck.commander_scryfall_id!)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    transform: `translateX(${offset * 100}px) rotate(${offset * 8}deg)`,
                    opacity: 0.55,
                    zIndex: artDecks.length - Math.abs(offset),
                  }}
                />
              )
            })}
            {/* Gradient overlay: fade art into background at top and bottom */}
            <div className="from-background/70 via-background/80 to-background absolute inset-0 bg-gradient-to-b" />
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 container mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight [text-shadow:0_2px_24px_rgba(0,0,0,0.9)] sm:text-6xl">
            Trade MTG decks
            <br />
            <span className="text-muted-foreground">near you</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
            DeckTrader connects Magic: The Gathering players across Canada for
            in-person deck trades. Browse what&apos;s available, propose a swap,
            and meet up locally.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Get started — it&apos;s free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/decks">Browse decks</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            {VALUE_PROPS.map((prop) => (
              <div key={prop.title} className="space-y-2">
                <div className="text-3xl">{prop.icon}</div>
                <h2 className="font-semibold">{prop.title}</h2>
                <p className="text-muted-foreground text-sm">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured decks */}
      {featuredDecks && featuredDecks.length > 0 && (
        <section>
          <div className="container mx-auto max-w-6xl px-4 py-16">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-2xl font-bold">Recently listed decks</h2>
              <Link
                href="/decks"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredDecks.map((deck) => (
                <PublicDeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA footer */}
      <section className="border-t">
        <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold">Ready to start trading?</h2>
          <p className="text-muted-foreground mt-2">
            Create an account, import your decks, and find your next trade.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/register">Create free account</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
