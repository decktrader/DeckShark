import { createClient } from '@/lib/supabase/server'
import type { ServiceResponse, User } from '@/types'

export async function getUserById(id: string): Promise<ServiceResponse<User>> {
  const supabase = await createClient()
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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as User, error: null }
}
