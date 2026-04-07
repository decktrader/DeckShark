import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeckForm } from '@/components/deck/deck-form'

export default async function NewDeckPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <DeckForm userId={authUser.id} />
    </main>
  )
}
