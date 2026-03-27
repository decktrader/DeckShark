import { notFound } from 'next/navigation'
import { getUserByUsername } from '@/lib/services/users.server'
import { getPublicDecks } from '@/lib/services/decks.server'
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

  const { data: userDecks } = await getPublicDecks({ userId: user.id })

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
    </main>
  )
}
