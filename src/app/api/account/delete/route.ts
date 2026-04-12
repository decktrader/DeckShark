import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { checkRateLimit, getIp, authLimiter } from '@/lib/rate-limit'

export async function DELETE(request: Request) {
  const { success } = await checkRateLimit(authLimiter, getIp(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { password, confirmation } = body as {
    password?: string
    confirmation?: string
  }

  // Determine auth provider
  const isOAuth = user.app_metadata?.provider !== 'email'

  if (isOAuth) {
    // OAuth users: require typing "DELETE" to confirm
    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Type DELETE to confirm account deletion.' },
        { status: 400 },
      )
    }
  } else {
    // Email users: require password re-entry
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete your account.' },
        { status: 400 },
      )
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Incorrect password.' },
        { status: 403 },
      )
    }
  }

  // Use service role to delete the auth user (cascades to public.users via FK)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
