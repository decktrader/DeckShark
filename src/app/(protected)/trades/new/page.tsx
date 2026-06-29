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
    <main className="mx-auto max-w-[1080px] px-[30px] pt-[26px] pb-[60px]">
      <h1 className="font-display mb-1 text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.02em]">
        Propose a trade
      </h1>
      <p className="text-ink-2 mb-6 text-[13.5px]">
        Pick decks to offer, even it out with cash if needed, and send a
        message.
      </p>
      <ProposeTradeForm
        targetDeck={targetDeck}
        myDecks={availableDecks}
        userId={authUser.id}
      />
    </main>
  )
}
