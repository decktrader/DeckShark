import Link from 'next/link'
import { getPublicWantLists } from '@/lib/services/wantlists.server'
import { Button } from '@/components/ui/button'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export const metadata = {
  title: 'Want Lists — DeckTrader',
  description: 'See what MTG decks traders across Canada are looking for.',
}

export default async function WantListsPage() {
  const { data: wantLists } = await getPublicWantLists()

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Want lists</h1>
          <p className="text-muted-foreground mt-1">
            Traders across Canada looking for their next deck
          </p>
        </div>
        <Button asChild>
          <Link href="/want-lists/new">Create want list</Link>
        </Button>
      </div>

      {!wantLists || wantLists.length === 0 ? (
        <p className="text-muted-foreground">No want lists yet.</p>
      ) : (
        <div className="space-y-3">
          {wantLists.map((wl) => (
            <Link key={wl.id} href={`/want-lists/${wl.id}`}>
              <div className="bg-card hover:border-primary/50 rounded-lg border p-4 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{wl.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {wl.owner.username}
                      {wl.owner.city &&
                        ` · ${wl.owner.city}, ${wl.owner.province}`}
                    </p>
                    <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-xs">
                      {wl.format && (
                        <span className="capitalize">{wl.format}</span>
                      )}
                      {wl.archetype && <span>{wl.archetype}</span>}
                      {wl.commander_name && <span>{wl.commander_name}</span>}
                      {(wl.min_value_cents || wl.max_value_cents) && (
                        <span>
                          {formatPrice(wl.min_value_cents)} –{' '}
                          {wl.max_value_cents
                            ? formatPrice(wl.max_value_cents)
                            : 'any'}
                        </span>
                      )}
                    </div>
                    {wl.description && (
                      <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                        {wl.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
