import { notFound } from 'next/navigation'
import { getUserByUsername } from '@/lib/services/users.server'
import { ProfileCard } from '@/components/profile/profile-card'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const { data: user } = await getUserByUsername(username)

  if (!user) notFound()

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <ProfileCard user={user} />
    </main>
  )
}
