import { createClient } from '@/lib/supabase/server'
import type { Notification, NotificationType, ServiceResponse } from '@/types'

/** Create an in-app notification */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}): Promise<ServiceResponse<Notification>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      link: link ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Notification, error: null }
}

/** Get notifications for a user (paginated, newest first) */
export async function getUserNotifications(
  userId: string,
  options?: { limit?: number; offset?: number },
): Promise<ServiceResponse<Notification[]>> {
  const supabase = await createClient()
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { data: null, error: error.message }
  return { data: data as Notification[], error: null }
}

/** Get count of unread notifications */
export async function getUnreadCount(
  userId: string,
): Promise<ServiceResponse<number>> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}
