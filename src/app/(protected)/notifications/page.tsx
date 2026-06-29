import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserNotifications } from '@/lib/services/notifications.server'
import { NotificationList } from '@/components/notification-list'

export const metadata = {
  title: 'Notifications — DeckShark',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: notifications } = await getUserNotifications(authUser.id, {
    limit: 50,
  })

  return (
    <main className="mx-auto max-w-[760px] px-[30px] pt-[26px] pb-[60px]">
      <NotificationList initialNotifications={notifications ?? []} />
    </main>
  )
}
