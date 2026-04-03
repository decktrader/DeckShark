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
    <header className="relative z-50 border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center text-2xl font-bold"
        >
          <Image
            src="/logo.png"
            alt="DeckShark logo"
            width={35}
            height={35}
            className="mr-2 h-[35px] w-auto"
            priority
          />
          DeckShark<span className="text-primary">.gg</span>
        </Link>
        <HeaderSearch />
        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 sm:flex">
          <Link
            href="/decks"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Browse
          </Link>
          <Link
            href="/want-lists"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Want Lists
          </Link>
          {profile && <TradeBadge />}
          {profile ? (
            <UserMenu username={profile.username} />
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="sm:hidden">
          <MobileNav isLoggedIn={!!profile} />
        </div>
      </div>
    </header>
  )
}
