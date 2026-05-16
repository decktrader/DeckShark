import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp, authLimiter } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const { success } = await checkRateLimit(authLimiter, getIp(request))
  const { searchParams, origin } = new URL(request.url)

  if (!success) {
    return NextResponse.redirect(`${origin}/login?error=rate_limited`)
  }

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Save referral source for Google OAuth signups
      const ref = searchParams.get('ref')
      if (ref && data.user) {
        await supabase
          .from('users')
          .update({ referral_source: ref })
          .eq('id', data.user.id)
          .is('referral_source', null) // Only set if not already set
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
