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
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <NotificationList initialNotifications={notifications ?? []} />
    </main>
  )
}
