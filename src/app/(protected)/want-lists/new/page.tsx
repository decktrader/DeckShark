import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WantListForm } from '@/components/want-lists/want-list-form'

export default async function NewWantListPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  return (
    <main className="container mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Create want list</h1>
      <WantListForm userId={authUser.id} />
    </main>
  )
}
