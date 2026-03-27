import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/services/users.server'
import { UserMenu } from '@/components/user-menu'
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
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          DeckTrader
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/decks"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Browse
          </Link>
          {profile && (
            <Link
              href="/trades"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Trades
            </Link>
          )}
          {profile ? (
            <UserMenu username={profile.username} />
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
