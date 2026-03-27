import { createClient } from '@/lib/supabase/client'
import type { ServiceResponse, User, NotificationPreferences } from '@/types'

export async function getUserById(id: string): Promise<ServiceResponse<User>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as User, error: null }
}

export async function getUserByUsername(
  username: string,
): Promise<ServiceResponse<User>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as User, error: null }
}

export async function updateUser(
  id: string,
  updates: Partial<
    Pick<
      User,
      | 'username'
      | 'bio'
      | 'city'
      | 'province'
      | 'avatar_url'
      | 'notification_preferences'
    >
  > & { notification_preferences?: NotificationPreferences },
): Promise<ServiceResponse<User>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as User, error: null }
}

export async function isUsernameAvailable(
  username: string,
): Promise<ServiceResponse<boolean>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data === null, error: null }
}

export function isOnboardingComplete(user: User): boolean {
  const hasRealUsername =
    !!user.username && !/_[a-f0-9]{8}$/.test(user.username)
  const hasCity = !!user.city
  const hasProvince = !!user.province
  return hasRealUsername && hasCity && hasProvince
}
