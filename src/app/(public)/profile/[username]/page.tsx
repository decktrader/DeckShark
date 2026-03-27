import { notFound } from 'next/navigation'
import { getUserByUsername } from '@/lib/services/users.server'
import { getPublicDecks } from '@/lib/services/decks.server'
import { getReviewsForUser } from '@/lib/services/reviews.server'
import { ProfileCard } from '@/components/profile/profile-card'
import { PublicDeckCard } from '@/components/deck/public-deck-card'

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

  return (
    <main className="container mx-auto max-w-2xl space-y-8 px-4 py-8">
      <ProfileCard user={user} />

      {(userDecks ?? []).length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Decks for trade</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(userDecks ?? []).map((deck) => (
              <PublicDeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </div>
      )}

      {(reviews ?? []).length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Reviews
            <span className="text-muted-foreground ml-2 text-base font-normal">
              {user.trade_rating
                ? `${Number(user.trade_rating).toFixed(1)} ★ · ${reviews!.length} review${reviews!.length !== 1 ? 's' : ''}`
                : `${reviews!.length} review${reviews!.length !== 1 ? 's' : ''}`}
            </span>
          </h2>
          <div className="space-y-3">
            {(reviews ?? []).map((review) => (
              <div key={review.id} className="bg-card rounded-lg border p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {review.reviewer.username}
                  </span>
                  <span className="text-sm text-yellow-400">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-muted-foreground text-sm">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
