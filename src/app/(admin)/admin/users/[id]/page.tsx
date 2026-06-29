import { notFound } from 'next/navigation'
import Link from 'next/link'
import { isValidUUID } from '@/lib/utils'
import { getAdminUser, getActiveSuspension } from '@/lib/services/admin.server'
import { getPublicDecks } from '@/lib/services/decks.server'
import { getReviewsForUser } from '@/lib/services/reviews.server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SuspendUserForm } from '@/components/admin/suspend-user-form'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isValidUUID(id)) notFound()

  const [
    { data: user },
    { data: suspension },
    { data: deckResult },
    { data: reviews },
  ] = await Promise.all([
    getAdminUser(id),
    getActiveSuspension(id),
    getPublicDecks({ userId: id }),
    getReviewsForUser(id),
  ])

  if (!user) notFound()

  const decks = deckResult?.decks ?? []
  const revs = reviews ?? []
  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/admin/users"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Users
        </Link>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.username} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-black">
            {user.username}
            {user.is_admin && (
              <span className="bg-terra/15 text-terra-deep ml-2 rounded px-2 py-0.5 text-xs font-bold">
                ADMIN
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            {user.city && user.province
              ? `${user.city}, ${user.province}`
              : 'No location'}
            {' · '}Joined{' '}
            {new Date(user.created_at).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">ID: {user.id}</p>
        </div>
      </div>

      {/* Suspension status */}
      {suspension && (
        <div className="border-terra/30 bg-terra/15 rounded-xl border p-4">
          <p className="text-terra-deep text-sm font-bold">Account suspended</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Reason: {suspension.reason}
          </p>
          {suspension.expires_at && (
            <p className="text-muted-foreground text-xs">
              Expires:{' '}
              {new Date(suspension.expires_at).toLocaleDateString('en-CA')}
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border-line rounded-lg border p-3 text-center">
          <p className="text-lg font-bold">{decks.length}</p>
          <p className="text-muted-foreground text-xs">Decks</p>
        </div>
        <div className="border-line rounded-lg border p-3 text-center">
          <p className="text-lg font-bold">{user.completed_trades}</p>
          <p className="text-muted-foreground text-xs">Trades</p>
        </div>
        <div className="border-line rounded-lg border p-3 text-center">
          <p className="text-lg font-bold">
            {user.completed_trades > 0
              ? Number(user.trade_rating).toFixed(1)
              : '—'}
          </p>
          <p className="text-muted-foreground text-xs">Rating</p>
        </div>
        <div className="border-line rounded-lg border p-3 text-center">
          <p className="text-lg font-bold">{revs.length}</p>
          <p className="text-muted-foreground text-xs">Reviews</p>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div>
          <h2 className="mb-1 text-sm font-bold">Bio</h2>
          <p className="text-muted-foreground text-sm">{user.bio}</p>
        </div>
      )}

      {/* Decks */}
      {decks.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-bold">Decks ({decks.length})</h2>
          <div className="border-line rounded-xl border">
            <div className="divide-line divide-y">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div>
                    <Link
                      href={`/decks/${deck.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {deck.name}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {deck.format}
                      {deck.commander_name ? ` · ${deck.commander_name}` : ''}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {deck.estimated_value_cents
                      ? `$${(deck.estimated_value_cents / 100).toFixed(0)}`
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews received */}
      {revs.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-bold">Reviews ({revs.length})</h2>
          <div className="space-y-2">
            {revs.map((review) => (
              <div
                key={review.id}
                className="border-line rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {review.reviewer.username}
                  </span>
                  <span className="text-brass-deep text-sm">
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

      {/* Admin actions */}
      {!user.is_admin && (
        <div className="border-line border-t pt-6">
          <h2 className="text-terra-deep mb-3 text-lg font-bold">
            Admin actions
          </h2>
          <SuspendUserForm
            userId={user.id}
            username={user.username}
            isSuspended={!!suspension}
            suspensionId={suspension?.id}
          />
        </div>
      )}
    </div>
  )
}
