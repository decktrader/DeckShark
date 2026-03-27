import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DeckForm } from '@/components/deck/deck-form'

export default async function NewDeckPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const params = await searchParams
  const isOnboarding = params.onboarding === 'true'

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      {isOnboarding && (
        <div className="mb-6 rounded-lg border border-dashed p-5">
          <h1 className="text-lg font-semibold">
            Welcome to DeckTrader! Add your first deck.
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Import from Moxfield or Archidekt, or paste your decklist. Once
            it&apos;s in, mark it as available for trade so other players can
            find it.
          </p>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground mt-3 inline-block text-sm underline-offset-4 hover:underline"
          >
            Skip for now, go to dashboard →
          </Link>
        </div>
      )}
      <DeckForm userId={authUser.id} />
    </main>
  )
}
