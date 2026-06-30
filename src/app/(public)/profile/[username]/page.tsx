import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getUserByUsername } from '@/lib/services/users.server'
import { getPublicDecks } from '@/lib/services/decks.server'
import type { PublicDeck } from '@/lib/services/decks.server'
import { getReviewsForUser } from '@/lib/services/reviews.server'
import { DeckArt } from '@/components/deck/deck-art'
import { ColorPips } from '@/components/deck/color-pips'
import { Pfp } from '@/components/ds/pfp'
import { Button } from '@/components/ui/button'
import { ReportButton } from '@/components/report-button'
import { formatPrice } from '@/lib/utils'

export const revalidate = 600 // 10 min ISR — no auth dependency

function DeckMiniCard({ deck }: { deck: PublicDeck }) {
  const commanderLabel = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="group border-line hover:border-line-2 hover:shadow-card block overflow-hidden rounded-lg border bg-white transition-[transform,box-shadow,border-color] hover:-translate-y-[3px]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0c2030]">
        <DeckArt
          commanderScryfallId={deck.commander_scryfall_id}
          partnerScryfallId={deck.partner_commander_scryfall_id}
          aspect="absolute inset-0 h-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[42%] to-[rgba(8,12,18,0.86)]" />
        {deck.color_identity?.length > 0 && (
          <ColorPips
            colors={deck.color_identity}
            onArt
            size={16}
            className="absolute top-2 right-2 z-[2] flex"
          />
        )}
        <div className="absolute inset-x-3 bottom-2.5 z-[2]">
          <p className="font-display text-paper truncate text-[13.5px] leading-tight font-bold">
            {deck.name}
          </p>
          {commanderLabel && (
            <p className="text-paper/60 truncate text-[10.5px]">
              {commanderLabel}
            </p>
          )}
        </div>
      </div>
      <div className="border-line flex items-center justify-between border-t px-3 py-2">
        <span className="text-slate text-[11px] capitalize">{deck.format}</span>
        <span className="text-teal-deep font-mono text-sm font-semibold">
          {formatPrice(deck.estimated_value_cents, { decimals: false })}
        </span>
      </div>
    </Link>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const { data: user } = await getUserByUsername(username)
  if (!user) return {}
  const title = `${username}'s profile | DeckShark`
  const description = user.city
    ? `MTG trader in ${user.city}${user.province ? `, ${user.province}` : ''}.`
    : 'MTG deck trader on DeckShark.'
  return {
    title,
    description,
    openGraph: { title, description, type: 'profile' },
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const { data: user } = await getUserByUsername(username)

  if (!user) notFound()

  const [{ data: deckResult }, { data: reviews }] = await Promise.all([
    getPublicDecks({ userId: user.id }),
    getReviewsForUser(user.id),
  ])

  const decks = deckResult?.decks ?? []
  const revs = reviews ?? []
  const location = [user.city, user.province].filter(Boolean).join(', ')
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <main className="mx-auto max-w-[1080px] px-[30px] pt-[26px] pb-[60px]">
      <div className="grid grid-cols-1 items-start gap-[26px] lg:grid-cols-[232px_1fr]">
        {/* Trader-badge sidebar */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-[84px]">
          <div className="border-line overflow-hidden rounded-lg border bg-white">
            <div className="bg-navy h-[58px]" />
            <div className="px-4 pb-4 text-center">
              <div className="-mt-[26px] flex justify-center">
                <Pfp
                  src={user.avatar_url}
                  name={user.username}
                  size={72}
                  className="border-4 border-white"
                />
              </div>
              <h1 className="font-display mt-2 text-[19px] font-bold">
                {user.username}
              </h1>
              {location && (
                <div className="text-slate mt-0.5 text-[12.5px]">
                  {location}
                </div>
              )}
              {user.bio && (
                <p className="text-ink-2 mt-3 text-[12.5px] leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="border-line grid grid-cols-3 rounded-lg border bg-white">
            <div className="border-line border-r py-3 text-center">
              <div className="font-display text-[17px] font-bold">
                {user.completed_trades}
              </div>
              <div className="text-slate mt-0.5 text-[10.5px]">Trades</div>
            </div>
            <div className="border-line border-r py-3 text-center">
              <div className="font-display text-brass-deep text-[17px] font-bold">
                {user.completed_trades > 0
                  ? Number(user.trade_rating).toFixed(1)
                  : '–'}
              </div>
              <div className="text-slate mt-0.5 text-[10.5px]">Rating</div>
            </div>
            <div className="py-3 text-center">
              <div className="font-display text-[12px] font-bold">
                {joinedDate}
              </div>
              <div className="text-slate mt-0.5 text-[10.5px]">Joined</div>
            </div>
          </div>

          {decks.length > 0 && (
            <Button asChild variant="terra" className="w-full">
              <Link href={`/trades/new?deckId=${decks[0].id}`}>
                Propose a trade
              </Link>
            </Button>
          )}
          <div className="text-center">
            <ReportButton targetType="user" targetId={user.id} />
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-col gap-[30px]">
          {decks.length > 0 && (
            <div>
              <h2 className="font-display mb-3.5 text-xl font-bold tracking-[-0.01em]">
                Decks for trade{' '}
                <span className="text-slate text-base font-normal">
                  ({decks.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3">
                {decks.map((deck) => (
                  <DeckMiniCard key={deck.id} deck={deck} />
                ))}
              </div>
            </div>
          )}

          {revs.length > 0 && (
            <div>
              <h2 className="font-display mb-3.5 text-xl font-bold tracking-[-0.01em]">
                Reviews{' '}
                <span className="text-slate text-base font-normal">
                  {user.trade_rating
                    ? `${Number(user.trade_rating).toFixed(1)} ★ · `
                    : ''}
                  {revs.length}
                </span>
              </h2>
              <div className="space-y-2.5">
                {revs.map((review) => (
                  <div
                    key={review.id}
                    className="border-line rounded-lg border bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Pfp name={review.reviewer.username} size={26} />
                        <span className="text-ink text-sm font-semibold">
                          {review.reviewer.username}
                        </span>
                      </div>
                      <span className="text-brass text-sm">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-ink-2 mt-1.5 text-sm">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {decks.length === 0 && revs.length === 0 && (
            <p className="text-ink-2 py-20 text-center">
              This trader hasn&apos;t listed any decks yet.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
