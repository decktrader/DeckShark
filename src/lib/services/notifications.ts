import { createClient } from '@/lib/supabase/client'
import type { Notification, ServiceResponse } from '@/types'

/** Mark a single notification as read */
export async function markAsRead(
  notificationId: string,
): Promise<ServiceResponse<null>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

/** Mark all notifications as read for the current user */
export async function markAllRead(): Promise<ServiceResponse<null>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

/** Fetch recent notifications for the dropdown (client-side) */
export async function getRecentNotifications(
  limit = 10,
): Promise<ServiceResponse<Notification[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data: data as Notification[], error: null }
}

/** Get unread count (client-side) */
export async function getUnreadCountClient(): Promise<ServiceResponse<number>> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}
