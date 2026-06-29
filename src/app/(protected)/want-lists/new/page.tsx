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
    <main className="mx-auto max-w-[720px] px-[30px] pt-[26px] pb-[60px]">
      <WantListForm userId={authUser.id} />
    </main>
  )
}
