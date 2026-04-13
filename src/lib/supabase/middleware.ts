import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = [
    '/dashboard',
    '/settings',
    '/onboarding',
    '/decks',
    '/trades',
    '/admin',
  ]
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin routes — require is_admin flag
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Suspended users — redirect to /suspended for protected routes
  if (
    user &&
    isProtected &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/suspended')
  ) {
    const { data: suspension } = await supabase
      .from('user_suspensions')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .is('lifted_at', null)
      .limit(1)
      .maybeSingle()

    if (suspension) {
      // Check if not expired
      const isActive =
        !suspension.expires_at || new Date(suspension.expires_at) > new Date()
      if (isActive) {
        const url = request.nextUrl.clone()
        url.pathname = '/suspended'
        return NextResponse.redirect(url)
      }
    }
  }

  // Login page — redirect to dashboard if already authenticated
  // (register stays accessible so new accounts can always be created)
  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
