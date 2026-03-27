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

export default async function HomePage() {
  const { data: featuredDecks } = await getPublicDecks({ limit: 6 })

  return (
    <main>
      {/* Hero */}
      <section className="border-b">
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Trade MTG decks
            <br />
            <span className="text-muted-foreground">near you</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg">
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
