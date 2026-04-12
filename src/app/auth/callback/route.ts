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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
