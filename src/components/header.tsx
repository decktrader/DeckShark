import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { HeaderSearch } from '@/components/header-search'
import { UserMenu } from '@/components/user-menu'
import { MobileNav } from '@/components/mobile-nav'
import { TradeBadge } from '@/components/trade-badge'
import { Button } from '@/components/ui/button'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let profile = null
  if (authUser) {
    const { data } = await getUserById(authUser.id)
    profile = data
  }

  return (
    <header className="relative z-50 border-b border-white/5 bg-white/[2%] backdrop-blur-md">
      <div className="container mx-auto flex h-[72px] items-center gap-8 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-2xl font-bold"
        >
          <Image
            src="/logo.png"
            alt="DeckShark logo"
            width={36}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <span className="whitespace-nowrap">
            DeckShark<span className="text-primary">.gg</span>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m16 6 4 14" />
              <path d="M12 6v14" />
              <path d="M8 8v12" />
              <path d="M4 4v16" />
            </svg>
            Browse
          </Link>
          <Link
            href="/want-lists"
            className="text-muted-foreground hover:bg-accent flex items-center gap-1.5 rounded-full px-4 py-2 text-base font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
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
              <TradeBadge />
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
          <MobileNav isLoggedIn={!!profile} />
        </div>
      </div>
    </header>
  )
}
