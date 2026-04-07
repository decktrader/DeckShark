import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getUserByUsername } from '@/lib/services/users.server'
import { getPublicDecks } from '@/lib/services/decks.server'
import type { PublicDeck } from '@/lib/services/decks.server'
import { getReviewsForUser } from '@/lib/services/reviews.server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DeckArt } from '@/components/deck/deck-art'
import { Button } from '@/components/ui/button'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(0)}`
}

function DeckMiniCard({ deck }: { deck: PublicDeck }) {
  const commanderLabel = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  return (
    <Link href={`/decks/${deck.id}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
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
            {commanderLabel && (
              <p className="truncate text-xs text-white/50">{commanderLabel}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-3 py-2">
          <span className="text-muted-foreground text-xs capitalize">
            {deck.format}
          </span>
          <span className="text-primary text-sm font-bold">
            {formatPrice(deck.estimated_value_cents)}
          </span>
        </div>
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

  const [{ data: userDecks }, { data: reviews }] = await Promise.all([
    getPublicDecks({ userId: user.id }),
    getReviewsForUser(user.id),
  ])

  const decks = userDecks ?? []
  const revs = reviews ?? []
  const initials = user.username.slice(0, 2).toUpperCase()
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Sidebar */}
        <div className="shrink-0 sm:sticky sm:top-24 sm:w-56 sm:self-start">
          <div className="space-y-3">
            {/* Avatar card */}
            <div className="overflow-hidden rounded-xl border border-white/5 p-5">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user.avatar_url ?? undefined}
                    alt={user.username}
                  />
                  <AvatarFallback className="text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h1 className="mt-2 text-lg font-black">{user.username}</h1>
                {user.city && user.province && (
                  <p className="text-muted-foreground text-xs">
                    {user.city}, {user.province}
                  </p>
                )}
                {user.bio && (
                  <p className="text-muted-foreground mt-2 text-center text-xs leading-relaxed">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div className="rounded-xl border border-white/5 p-4">
              <div className="grid grid-cols-3 text-center text-sm">
                <div>
                  <p className="font-bold">{user.completed_trades}</p>
                  <p className="text-muted-foreground text-xs">Trades</p>
                </div>
                <div>
                  <p className="font-bold">
                    {user.completed_trades > 0
                      ? Number(user.trade_rating).toFixed(1)
                      : '—'}
                  </p>
                  <p className="text-muted-foreground text-xs">Rating</p>
                </div>
                <div>
                  <p className="text-xs font-bold">{joinedDate}</p>
                  <p className="text-muted-foreground text-xs">Joined</p>
                </div>
              </div>
            </div>

            {/* Action */}
            <Button className="w-full" asChild>
              <Link href={`/trades/new?receiver=${user.username}`}>
                Propose a trade
              </Link>
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-8">
          {decks.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-bold">
                Decks for trade{' '}
                <span className="text-muted-foreground text-base font-normal">
                  ({decks.length})
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {decks.map((deck) => (
                  <DeckMiniCard key={deck.id} deck={deck} />
                ))}
              </div>
            </div>
          )}

          {revs.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-bold">
                Reviews{' '}
                <span className="text-muted-foreground text-base font-normal">
                  {user.trade_rating
                    ? `${Number(user.trade_rating).toFixed(1)} ★ ·`
                    : ''}{' '}
                  {revs.length}
                </span>
              </h2>
              <div className="space-y-3">
                {revs.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-white/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {review.reviewer.username}
                      </span>
                      <span className="text-sm text-yellow-400">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {decks.length === 0 && revs.length === 0 && (
            <p className="text-muted-foreground py-20 text-center">
              This trader hasn&apos;t listed any decks yet.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
