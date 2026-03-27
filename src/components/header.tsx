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
  let pendingTradeCount = 0
  if (authUser) {
    const { data } = await getUserById(authUser.id)
    profile = data

    const { count } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', authUser.id)
      .eq('status', 'proposed')
    pendingTradeCount = count ?? 0
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
          <Link
            href="/want-lists"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Want Lists
          </Link>
          {profile && (
            <Link
              href="/trades"
              className="text-muted-foreground hover:text-foreground relative text-sm"
            >
              Trades
              {pendingTradeCount > 0 && (
                <span className="bg-primary absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {pendingTradeCount > 9 ? '9+' : pendingTradeCount}
                </span>
              )}
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
