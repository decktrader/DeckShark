import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { getWantList, getMatchingDecks } from '@/lib/services/wantlists.server'
import { PublicDeckCard } from '@/components/deck/public-deck-card'
import { Button } from '@/components/ui/button'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export default async function WantListPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isValidUUID(id)) notFound()

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: wantList } = await getWantList(id)
  if (!wantList) notFound()

  const isOwner = wantList.user_id === authUser.id
  const { data: matches } = await getMatchingDecks(wantList)

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-y-3">
        <div>
          <h1 className="text-2xl font-bold">{wantList.title}</h1>
          <p className="text-muted-foreground text-sm">
            {wantList.owner.username}
            {wantList.owner.city &&
              ` · ${wantList.owner.city}, ${wantList.owner.province}`}
          </p>
        </div>
        <div className="flex gap-2">
          {!isOwner && (
            <Button asChild size="sm">
              <Link href={`/profile/${wantList.owner.username}`}>
                Propose a trade
              </Link>
            </Button>
          )}
          {isOwner && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/want-lists/${id}/edit`}>Edit</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card mb-8 space-y-2 rounded-lg border p-4 text-sm">
        {wantList.format && (
          <p>
            <span className="text-muted-foreground">Format: </span>
            <span className="capitalize">{wantList.format}</span>
          </p>
        )}
        {wantList.archetype && (
          <p>
            <span className="text-muted-foreground">Archetype: </span>
            {wantList.archetype}
          </p>
        )}
        {wantList.commander_name && (
          <p>
            <span className="text-muted-foreground">Commander: </span>
            {wantList.commander_name}
          </p>
        )}
        {(wantList.min_value_cents || wantList.max_value_cents) && (
          <p>
            <span className="text-muted-foreground">Value range: </span>
            {formatPrice(wantList.min_value_cents)} –{' '}
            {wantList.max_value_cents
              ? formatPrice(wantList.max_value_cents)
              : 'any'}
          </p>
        )}
        {wantList.description && (
          <p className="text-muted-foreground pt-1">{wantList.description}</p>
        )}
      </div>

      <h2 className="mb-4 text-lg font-semibold">
        Matching decks available
        {matches && matches.length > 0 && (
          <span className="text-muted-foreground ml-2 text-sm font-normal">
            {matches.length} found
          </span>
        )}
      </h2>

      {!matches || matches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No decks currently match this want list. Check back later.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((deck) => (
            <PublicDeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </main>
  )
}
