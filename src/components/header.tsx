import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { HeaderSearch } from '@/components/header-search'
import { UserMenu } from '@/components/user-menu'
import { MobileNav } from '@/components/mobile-nav'
import { NotificationBell } from '@/components/notification-bell'
import {
  getUserNotifications,
  getUnreadCount,
} from '@/lib/services/notifications.server'
import { Button } from '@/components/ui/button'

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
    <header className="relative z-50 border-b border-white/5 bg-white/[2%] backdrop-blur-md">
      <div className="container mx-auto flex h-[72px] items-center gap-8 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo.png"
            alt="DeckShark.gg"
            width={160}
            height={38}
            className="h-[38px] w-auto"
            priority
          />
          <span className="inline-flex items-center rounded border border-purple-500/50 bg-purple-500/15 px-1.5 py-0.5 text-[8px] leading-none font-semibold tracking-widest text-purple-400 uppercase">
            Alpha
          </span>
        </Link>

        {/* Desktop search */}
        <HeaderSearch />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/decks"
            className="text-muted-foreground hover:bg-accent flex items-center gap-1.5 rounded-full px-4 py-2 text-base font-medium"
          >
            Browse Decks
          </Link>
          <Link
            href="/want-lists"
            className="text-muted-foreground hover:bg-accent flex items-center gap-1.5 rounded-full px-4 py-2 text-base font-medium"
          >
            Want Lists
          </Link>
          {profile && (
            <Link
              href="/trades"
              className="text-muted-foreground hover:bg-accent flex items-center gap-1.5 rounded-full px-4 py-2 text-base font-medium"
            >
              Trades
            </Link>
          )}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 sm:flex">
          {profile ? (
            <>
              <Link
                href="/decks/new"
                className="bg-primary hover:bg-primary/90 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-colors"
                aria-label="New deck"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </Link>
              <NotificationBell
                initialNotifications={initialNotifications ?? []}
                initialUnreadCount={initialUnreadCount}
              />
              {profile.is_admin && (
                <Link
                  href="/admin"
                  className="text-muted-foreground hover:bg-accent rounded-full px-3 py-2 text-xs font-medium"
                >
                  Admin
                </Link>
              )}
              <UserMenu
                username={profile.username}
                avatarUrl={profile.avatar_url}
              />
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden">
          <MobileNav isLoggedIn={!!profile} username={profile?.username} />
        </div>
      </div>
    </header>
  )
}
