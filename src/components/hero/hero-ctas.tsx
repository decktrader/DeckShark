'use client'

import Link from 'next/link'

export function HeroCTAs() {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() =>
          document
            .getElementById('browse')
            ?.scrollIntoView({ behavior: 'smooth' })
        }
        className="rounded-full px-7 py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
        }}
      >
        Browse decks &rarr;
      </button>
      <Link
        href="/register"
        className="rounded-full border border-white/[0.12] bg-white/[0.04] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/[0.08]"
      >
        List your deck
      </Link>
    </div>
  )
}
