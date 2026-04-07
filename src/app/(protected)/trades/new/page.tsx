import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPublicDeck } from '@/lib/services/decks.server'
import { getUserDecks } from '@/lib/services/decks.server'
import { ProposeTradeForm } from '@/components/trades/propose-trade-form'

export default async function NewTradePage({
  searchParams,
}: {
  searchParams: Promise<{ deckId?: string }>
}) {
  const { deckId } = await searchParams

  if (!deckId) notFound()

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const [{ data: targetDeck }, { data: myDecks }] = await Promise.all([
    getPublicDeck(deckId),
    getUserDecks(authUser.id),
  ])

  if (!targetDeck) notFound()

  // Can't trade with yourself
  if (targetDeck.user_id === authUser.id) redirect(`/decks/${deckId}`)

  // Only show decks the user has marked as available for trade
  const availableDecks = (myDecks ?? []).filter((d) => d.available_for_trade)

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-black tracking-tight">
        Propose a trade
      </h1>
      <ProposeTradeForm
        targetDeck={targetDeck}
        myDecks={availableDecks}
        userId={authUser.id}
      />
    </main>
  )
}
