import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | DeckShark',
  description:
    'The story behind DeckShark: one developer building the deck-trading platform MTG players deserve.',
}

export default function AboutPage() {
  return (
    <main className="relative">
      {/* Background gradient matching hero */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, #0b0418 0%, #1a0f2e 40%, #0f172a 100%)',
        }}
      />

      <div className="mx-auto max-w-[44rem] px-6 pt-16 pb-24">
        {/* Back link + badge */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/"
            className="text-[13px] text-white/60 transition-colors hover:text-white"
          >
            &larr; Back to DeckShark
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-600/30 bg-violet-600/[0.12] px-3 py-1.5 text-xs text-violet-300">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: '0 0 8px #34d399' }}
            />
            Alpha &middot; 2025
          </span>
        </div>

        {/* Hero headline */}
        <h1
          className="mb-6 font-extrabold"
          style={{
            fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          DeckShark is small, and that&apos;s the&nbsp;point.
        </h1>
        <p className="mb-12 text-lg leading-relaxed text-white/70">
          DeckShark is one MTG player trying to fix a frustration I&apos;ve
          always had: the only way to get a new Commander deck without spending
          a weekend hunting singles is to know someone with a deck they&apos;re
          bored of. I&apos;m building the platform I wished existed.
        </p>

        {/* What we're trying to do */}
        <h2 className="mt-10 mb-3 text-xl font-bold tracking-tight">
          What I&apos;m trying to do
        </h2>
        <p className="mb-5 leading-[1.7] text-white/75">
          Most card marketplaces are about singles. Pricing, scanning, shipping
          individual cards. That&apos;s a great market. I&apos;m not it.
          DeckShark is about the <em>built</em> deck: the 100 cards you&apos;ve
          sleeved, tuned, and played with for months, and then put on the shelf
          because you want to try something new.
        </p>
        <p className="mb-5 leading-[1.7] text-white/75">
          Trading whole decks is faster, more local, and feels more like the
          hobby itself. You meet at an LGS or a coffee shop, you swap, you go
          home with a new deck for your next game night.
        </p>

        {/* Who's building this */}
        <h2 className="mt-10 mb-3 text-xl font-bold tracking-tight">
          Who&apos;s building this
        </h2>
        <div className="my-8">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-400 text-lg font-bold text-white">
              J
            </div>
            <div className="mb-1 text-[12px] tracking-wider text-violet-300/70 uppercase">
              Founder &middot; Design &amp; Engineering
            </div>
            <div className="mb-2 text-lg font-bold">GreatWhite</div>
            <p className="text-[13px] leading-relaxed text-white/60">
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

        {/* How the money works */}
        <h2 className="mt-10 mb-3 text-xl font-bold tracking-tight">
          How the money works
        </h2>
        <p className="mb-5 leading-[1.7] text-white/75">
          Right now, it doesn&apos;t. DeckShark is free during alpha. No ads, no
          VC funding, no pressure to grow at all costs. I just want to make
          something the community actually uses.
        </p>
        <p className="mb-5 leading-[1.7] text-white/75">
          Phase 2 will add shipping so you can trade decks between cities, not
          just locally. That&apos;s where fees will come in: a small cut to
          cover escrow and shipping logistics. Local trades will always be free.
        </p>

        {/* Your trades shape the platform */}
        <h2 className="mt-10 mb-3 text-xl font-bold tracking-tight">
          Your trades shape the platform
        </h2>
        <p className="mb-5 leading-[1.7] text-white/75">
          Every feature on the roadmap right now came from someone listing a
          deck and telling me what was missing. Power-level filters, city-level
          activity, want lists. All of it came from users.
        </p>
        <ul className="mb-8 list-disc space-y-2 pl-5 leading-relaxed text-white/75">
          <li>Found a bug? Tell me, I&apos;ll fix it that day.</li>
          <li>Want a feature? Send feedback. I read every message.</li>
          <li>
            First 500 traders get a permanent &ldquo;Founding Member&rdquo;
            badge.
          </li>
        </ul>

        <Link
          href="/#feedback"
          className="inline-flex rounded-full px-7 py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
          }}
        >
          Submit feedback
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-10 text-center text-[13px] text-white/40">
        &copy; 2025 DeckShark.gg &middot; Made by one player in Canada.
      </footer>
    </main>
  )
}
