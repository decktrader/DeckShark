import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import {
  getDeck,
  getDeckCards,
  getDeckPhotos,
} from '@/lib/services/decks.server'
import { DeckEditForm } from '@/components/deck/deck-edit-form'

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isValidUUID(id)) notFound()

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const [deckResult, cardsResult, photosResult] = await Promise.all([
    getDeck(id),
    getDeckCards(id),
    getDeckPhotos(id),
  ])

  if (!deckResult.data) notFound()

  // Only the owner can edit
  if (deckResult.data.user_id !== authUser.id) notFound()

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <DeckEditForm
        deck={deckResult.data}
        cards={cardsResult.data ?? []}
        photos={photosResult.data ?? []}
        userId={authUser.id}
      />
    </main>
  )
}
