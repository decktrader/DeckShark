import Link from 'next/link'
import { Brand } from '@/components/ds/brand'
import { FeedbackForm } from '@/components/feedback-form'

function FooterCol({
  title,
  links,
}: {
  title: string
  links: [string, string][]
}) {
  return (
    <div>
      <h5 className="font-display text-brass mb-3 text-[13px] font-bold">
        {title}
      </h5>
      {links.map(([label, href]) => (
        <Link
          key={label}
          href={href}
          className="text-paper/[0.72] hover:text-paper block py-1 text-[13.5px]"
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

export function Footer() {
  return (
    <footer id="feedback" className="bg-navy text-paper mt-12">
      <div className="mx-auto max-w-[1280px] px-[30px] pt-12 pb-[34px]">
        <div className="border-line-navy grid grid-cols-1 gap-8 border-b pb-[30px] md:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div>
            <Brand wordmarkClassName="text-[18px] text-paper" />
            <p className="text-paper/[0.66] mt-3 max-w-[300px] text-[13px] leading-relaxed">
              The Harbour for Commander players. Discover who is trading, what
              is moving, and where your next deck is waiting, across Canada and
              the US.
            </p>
          </div>
          <FooterCol
            title="Browse"
            links={[
              ['All decks', '/decks'],
              ['Want lists', '/want-lists'],
            ]}
          />
          <FooterCol
            title="Community"
            links={[
              ['Market Pulse', '/pulse'],
              ['Active traders', '/community'],
              ['List a deck', '/decks/new'],
            ]}
          />
          <div>
            <h5 className="font-display text-brass mb-3 text-[13px] font-bold">
              DeckShark
            </h5>
            <Link
              href="/about"
              className="text-paper/[0.72] hover:text-paper block py-1 text-[13.5px]"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-paper/[0.72] hover:text-paper block py-1 text-[13.5px]"
            >
              Privacy
            </Link>
            <div className="text-paper/[0.72] py-1 text-[13.5px]">
              <FeedbackForm />
            </div>
          </div>
        </div>
        <div className="text-paper/50 flex flex-wrap gap-4 pt-[22px] font-mono text-[10.5px] leading-relaxed">
          <span>
            Card prices from Scryfall, in USD, a friendly guide and not an
            appraisal. No fees, no proprietary currency. Every trade happens in
            person.
          </span>
          <span className="ml-auto">
            2026 DeckShark, made by players, in Canada
          </span>
        </div>
      </div>
    </footer>
  )
}
