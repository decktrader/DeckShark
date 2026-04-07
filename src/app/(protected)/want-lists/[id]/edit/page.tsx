import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { getWantList } from '@/lib/services/wantlists.server'
import { WantListForm } from '@/components/want-lists/want-list-form'

export default async function EditWantListPage({
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

  const { data: wantList } = await getWantList(id)
  if (!wantList) notFound()
  if (wantList.user_id !== authUser.id) notFound()

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <WantListForm userId={authUser.id} existing={wantList} />
    </main>
  )
}
