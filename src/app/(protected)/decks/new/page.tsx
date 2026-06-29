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
    <main className="mx-auto max-w-[760px] px-[30px] pt-[26px] pb-[60px]">
      <DeckForm userId={authUser.id} />
    </main>
  )
}
