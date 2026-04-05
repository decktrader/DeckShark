import Link from 'next/link'
import type { Metadata } from 'next'
import { getPublicDecks } from '@/lib/services/decks.server'
import { PublicDeckCard } from '@/components/deck/public-deck-card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'DeckShark — Trade MTG Decks Near You',
  description:
    'Find local Magic: The Gathering players and trade decks in person. Browse trade-available decks across Canada.',
  openGraph: {
    title: 'DeckShark — Trade MTG Decks Near You',
    description:
      'Find local Magic: The Gathering players and trade decks in person. Browse trade-available decks across Canada.',
    type: 'website',
  },
}

function scryfallArtUrl(scryfallId: string) {
  return `https://cards.scryfall.io/art_crop/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
}

export default async function HomePage() {
  const { data: featuredDecks } = await getPublicDecks({ limit: 6 })
  const heroArt = (featuredDecks ?? []).find((d) => d.commander_scryfall_id)

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Background art */}
        {heroArt?.commander_scryfall_id && (
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${scryfallArtUrl(heroArt.commander_scryfall_id)})`,
              filter: 'blur(2px)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/70" />
        <div
          className="absolute inset-0"
          style={{
            animation: 'heroShift 15s ease-in-out infinite alternate',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-4 py-20">
          {/* Frosted glass CTA panel */}
          <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl backdrop-blur-xl sm:px-14">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Your next deck trade
              <span className="text-primary"> starts here</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-base leading-relaxed sm:text-lg">
              DeckShark lets you trade Commander decks face-to-face with players
              in your city. Swap the deck collecting dust for your next
              favourite build, and meet your local MTG community along the way.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="px-8 text-base">
                <Link href="/register">Get started — it&apos;s free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 px-8"
              >
                <Link href="/decks">Browse decks</Link>
              </Button>
            </div>
          </div>

          {/* Value props */}
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-8 py-10 backdrop-blur-md">
              <div className="text-primary mb-2 text-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">
                Track your collection
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Import from Moxfield or Archidekt in one click. Prices update
                daily from Scryfall.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-8 py-10 backdrop-blur-md">
              <div className="text-primary mb-2 text-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">
                Find traders in your city
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Filter by format, commander, colours, price, and location. See
                what&apos;s available near you.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-8 py-10 backdrop-blur-md">
              <div className="text-primary mb-2 text-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">
                Trade with confidence
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Propose swaps with cash balancing, counter-offer, and share
                contact info securely. Reviews build reputation.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mx-auto mt-12 flex max-w-4xl items-center justify-center gap-6 text-base text-white/60 max-sm:flex-wrap">
            <span className="flex items-center gap-2.5">
              <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                1
              </span>
              Import your decks
            </span>
            <span className="hidden text-lg text-white/20 sm:inline">→</span>
            <span className="flex items-center gap-2.5">
              <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                2
              </span>
              Browse &amp; find trades
            </span>
            <span className="hidden text-lg text-white/20 sm:inline">→</span>
            <span className="flex items-center gap-2.5">
              <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                3
              </span>
              Propose a swap
            </span>
            <span className="hidden text-lg text-white/20 sm:inline">→</span>
            <span className="flex items-center gap-2.5">
              <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                4
              </span>
              Meet up &amp; trade
            </span>
          </div>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes heroShift {
                0% { background: linear-gradient(180deg, rgba(88,28,135,0.2) 0%, transparent 50%); }
                100% { background: linear-gradient(180deg, rgba(30,58,138,0.2) 0%, transparent 50%); }
              }
            `,
          }}
        />
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
