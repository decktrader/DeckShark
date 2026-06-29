import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { UserMenu } from '@/components/user-menu'
import { MobileNav } from '@/components/mobile-nav'
import { NotificationBell } from '@/components/notification-bell'
import {
  getUserNotifications,
  getUnreadCount,
} from '@/lib/services/notifications.server'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/ds/brand'

const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'The Harbour' },
  { href: '/decks', label: 'Browse' },
  { href: '/pulse', label: 'Market Pulse' },
  { href: '/want-lists', label: 'Want Lists' },
]

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let profile = null
  let initialNotifications: Awaited<
    ReturnType<typeof getUserNotifications>
  >['data'] = []
  let initialUnreadCount = 0
  if (authUser) {
    const [{ data }, { data: notifs }, { data: count }] = await Promise.all([
      getUserById(authUser.id),
      getUserNotifications(authUser.id, { limit: 10 }),
      getUnreadCount(authUser.id),
    ])
    profile = data
    initialNotifications = notifs ?? []
    initialUnreadCount = count ?? 0
  }

  return (
    <header className="border-line bg-paper sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-[30px]">
        <Brand />

        {/* Desktop nav */}
        <nav className="ml-1.5 hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-2 hover:bg-paper-2 hover:text-ink rounded-md px-[13px] py-2 text-sm font-semibold transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {profile && (
            <Link
              href="/trades"
              className="text-ink-2 hover:bg-paper-2 hover:text-ink rounded-md px-[13px] py-2 text-sm font-semibold transition-colors"
            >
              Trades
            </Link>
          )}
        </nav>

        {/* Desktop actions */}
        <div className="ml-auto hidden items-center gap-3 sm:flex">
          {profile ? (
            <>
              <NotificationBell
                initialNotifications={initialNotifications ?? []}
                initialUnreadCount={initialUnreadCount}
              />
              <Button asChild variant="terra" size="sm">
                <Link href="/decks/new">List a deck</Link>
              </Button>
              {profile.is_admin && (
                <Link
                  href="/admin"
                  className="text-ink-2 hover:bg-paper-2 hover:text-ink rounded-md px-3 py-2 text-xs font-semibold"
                >
                  Admin
                </Link>
              )}
              <UserMenu
                username={profile.username}
                avatarUrl={profile.avatar_url}
                city={profile.city}
                province={profile.province}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-ink-2 hover:text-ink text-sm font-semibold"
              >
                Sign in
              </Link>
              <Button asChild variant="terra" size="sm">
                <Link href="/register">List a deck</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile nav */}
        <div className="ml-auto sm:hidden">
          <MobileNav isLoggedIn={!!profile} username={profile?.username} />
        </div>
      </div>
    </header>
  )
}
