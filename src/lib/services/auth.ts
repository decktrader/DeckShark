import { createClient } from '@/lib/supabase/client'
import type { ServiceResponse } from '@/types'
import type { AuthError, User as AuthUser } from '@supabase/supabase-js'

function genericAuthError(error: AuthError, context: string): string {
  console.error(`[auth] ${context}:`, error.message)

  const msg = error.message.toLowerCase()

  if (msg.includes('invalid login credentials') || msg.includes('invalid'))
    return 'Invalid email or password.'
  if (
    msg.includes('already registered') ||
    msg.includes('already been registered')
  )
    return 'An account with this email already exists.'
  if (msg.includes('email not confirmed'))
    return 'Please confirm your email before signing in.'
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Too many attempts. Please wait a moment and try again.'

  return 'Something went wrong. Please try again.'
}

export async function signUp(
  email: string,
  password: string,
): Promise<ServiceResponse<AuthUser>> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { data: null, error: genericAuthError(error, 'signUp') }
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

  if (error) return { data: null, error: genericAuthError(error, 'signIn') }
  return { data: data.user, error: null }
}

export async function signInWithGoogle(): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error)
    return { data: null, error: genericAuthError(error, 'signInWithGoogle') }
  return { data: null, error: null }
}

export async function signOut(): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()

  if (error) return { data: null, error: genericAuthError(error, 'signOut') }
  return { data: null, error: null }
}
