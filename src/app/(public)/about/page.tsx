import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'

export const revalidate = 86400 // 1 day — static content

export const metadata: Metadata = {
  title: 'About | DeckShark',
  description:
    'The story behind DeckShark: one developer building the deck-trading platform MTG players deserve.',
}

export default function AboutPage() {
  return (
    <main>
      <div className="mx-auto max-w-[44rem] px-[30px] pt-12 pb-20">
        {/* Back link + badge */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/"
            className="text-ink-2 hover:text-ink text-[13px] font-semibold transition-colors"
          >
            ← Back to DeckShark
          </Link>
          <span className="rounded-pill border-teal/30 bg-teal/[0.12] text-teal-deep inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-semibold">
            <span className="animate-beat bg-teal h-1.5 w-1.5 rounded-full" />
            Alpha · 2026
          </span>
        </div>

        {/* Hero headline */}
        <h1 className="font-display mb-6 text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em]">
          DeckShark is small, and that&apos;s the&nbsp;point.
        </h1>
        <p className="text-ink-2 mb-12 text-lg leading-relaxed">
          DeckShark is one MTG player trying to fix a frustration I&apos;ve
          always had: the only way to get a new Commander deck without spending
          a weekend hunting singles is to know someone with a deck they&apos;re
          bored of. I&apos;m building the platform I wished existed.
        </p>

        <h2 className="font-display mt-10 mb-3 text-xl font-bold tracking-tight">
          What I&apos;m trying to do
        </h2>
        <p className="text-ink-2 mb-5 leading-[1.7]">
          Most card marketplaces are about singles. Pricing, scanning, shipping
          individual cards. That&apos;s a great market. I&apos;m not it.
          DeckShark is about the <em>built</em> deck: the 100 cards you&apos;ve
          sleeved, tuned, and played with for months, and then put on the shelf
          because you want to try something new.
        </p>
        <p className="text-ink-2 mb-5 leading-[1.7]">
          Trading whole decks is faster, more local, and feels more like the
          hobby itself. You meet at a local game store or a coffee shop, you
          swap, you go home with a new deck for your next game night.
        </p>

        <h2 className="font-display mt-10 mb-3 text-xl font-bold tracking-tight">
          Who&apos;s building this
        </h2>
        <div className="my-8">
          <div className="border-line rounded-lg border bg-white p-5">
            <div className="from-brass to-terra font-display text-paper mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold">
              G
            </div>
            <div className="text-brass-deep mb-1 font-mono text-[11px] tracking-[0.1em] uppercase">
              Founder · Design &amp; Engineering
            </div>
            <div className="font-display mb-2 text-lg font-bold">
              GreatWhite
            </div>
            <p className="text-ink-2 text-[13px] leading-relaxed">
              Designer and developer in Vancouver, Canada. I handle everything
              from the UI design to the database migrations. I&apos;ve been
              playing Commander for 8 years and my current favourite commander
              is Hashaton, Scarab&apos;s Fist. I started DeckShark when I
              realized I only played a handful of my 15 decks and some had been
              sitting for months, even years. All I wanted was an easy way to
              swap them for something new.
            </p>
          </div>
        </div>

        <h2 className="font-display mt-10 mb-3 text-xl font-bold tracking-tight">
          How the money works
        </h2>
        <p className="text-ink-2 mb-5 leading-[1.7]">
          Right now, it doesn&apos;t. DeckShark is free during alpha. No ads, no
          VC funding, no pressure to grow at all costs. I just want to make
          something the community actually uses.
        </p>
        <p className="text-ink-2 mb-5 leading-[1.7]">
          Phase 2 will add shipping so you can trade decks between cities, not
          just locally. That&apos;s where fees will come in: a small cut to
          cover escrow and shipping logistics. Local trades will always be free.
        </p>

        <h2 className="font-display mt-10 mb-3 text-xl font-bold tracking-tight">
          Your trades shape the platform
        </h2>
        <p className="text-ink-2 mb-5 leading-[1.7]">
          Every feature on the roadmap right now came from someone listing a
          deck and telling me what was missing. Power-level filters, city-level
          activity, want lists. All of it came from users.
        </p>
        <ul className="text-ink-2 mb-8 list-disc space-y-2 pl-5 leading-relaxed">
          <li>Found a bug? Tell me, I&apos;ll fix it that day.</li>
          <li>Want a feature? Send feedback. I read every message.</li>
          <li>
            First 500 traders get a permanent &ldquo;Founding Member&rdquo;
            badge.
          </li>
        </ul>

        <Button asChild variant="terra">
          <Link href="/#feedback">Submit feedback</Link>
        </Button>
      </div>
    </main>
  )
}
