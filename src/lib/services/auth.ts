import { createClient } from '@/lib/supabase/client'
import type { ServiceResponse } from '@/types'
import type { User as AuthUser } from '@supabase/supabase-js'

export async function signUp(
  email: string,
  password: string,
): Promise<ServiceResponse<AuthUser>> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { data: null, error: error.message }
  return { data: data.user, error: null }
}

export async function signIn(
  email: string,
  password: string,
): Promise<ServiceResponse<AuthUser>> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { data: null, error: error.message }
  return { data: data.user, error: null }
}

export async function signOut(): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
