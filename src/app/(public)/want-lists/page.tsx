import Link from 'next/link'
import { getPublicWantLists } from '@/lib/services/wantlists.server'
import type { WantListWithOwner } from '@/lib/services/wantlists.server'
import { Button } from '@/components/ui/button'
import { PaginationNav } from '@/components/ui/pagination-nav'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(0)}`
}

function priceRange(wl: WantListWithOwner): string {
  if (!wl.min_value_cents && !wl.max_value_cents) return ''
  if (!wl.min_value_cents) return `Up to ${formatPrice(wl.max_value_cents)}`
  if (!wl.max_value_cents) return `${formatPrice(wl.min_value_cents)}+`
  return `${formatPrice(wl.min_value_cents)} – ${formatPrice(wl.max_value_cents)}`
}

const COLOR_MAP: Record<string, string> = {
  W: 'bg-amber-100 text-amber-900',
  U: 'bg-blue-500/20 text-blue-300',
  B: 'bg-zinc-600/40 text-zinc-200',
  R: 'bg-red-500/20 text-red-300',
  G: 'bg-emerald-500/20 text-emerald-300',
}

const FORMAT_COLORS: Record<string, string> = {
  commander: 'border-violet-500/40 text-violet-300',
  modern: 'border-sky-500/40 text-sky-300',
  standard: 'border-amber-500/40 text-amber-300',
  legacy: 'border-rose-500/40 text-rose-300',
  pauper: 'border-emerald-500/40 text-emerald-300',
  pioneer: 'border-orange-500/40 text-orange-300',
}

function accentGradient(format: string | null) {
  switch (format) {
    case 'commander':
      return 'from-violet-500/80 via-violet-500/30'
    case 'modern':
      return 'from-sky-500/80 via-sky-500/30'
    case 'standard':
      return 'from-amber-500/80 via-amber-500/30'
    case 'legacy':
      return 'from-rose-500/80 via-rose-500/30'
    case 'pauper':
      return 'from-emerald-500/80 via-emerald-500/30'
    default:
      return 'from-white/30 via-white/10'
  }
}

function bgTint(format: string | null) {
  switch (format) {
    case 'commander':
      return 'bg-gradient-to-r from-violet-500/[6%] to-transparent'
    case 'modern':
      return 'bg-gradient-to-r from-sky-500/[6%] to-transparent'
    case 'standard':
      return 'bg-gradient-to-r from-amber-500/[6%] to-transparent'
    case 'legacy':
      return 'bg-gradient-to-r from-rose-500/[6%] to-transparent'
    case 'pauper':
      return 'bg-gradient-to-r from-emerald-500/[6%] to-transparent'
    default:
      return ''
  }
}

function ColorPips({ colors }: { colors: string[] | null }) {
  if (!colors || colors.length === 0) return null
  return (
    <div className="flex gap-1">
      {colors.map((c) => (
        <span
          key={c}
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${COLOR_MAP[c] ?? 'bg-white/10 text-white/60'}`}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

export const metadata = {
  title: 'Want Lists — DeckShark',
  description: 'See what MTG decks traders across Canada are looking for.',
}

const PAGE_SIZE = 20

export default async function WantListsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))

  const { data: allWantLists } = await getPublicWantLists()
  const wantLists = allWantLists ?? []
  const totalPages = Math.max(1, Math.ceil(wantLists.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = wantLists.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight">Wanted decks</h1>
        <p className="text-muted-foreground mt-2">
          Traders across Canada are searching for these
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/want-lists/new">Post your want list</Link>
          </Button>
        </div>
      </div>

      {wantLists.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center text-lg">
          No want lists yet.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {pageItems.map((wl) => (
              <Link
                key={wl.id}
                href={`/want-lists/${wl.id}`}
                className="group block"
              >
                <div
                  className={`overflow-hidden rounded-xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5 ${bgTint(wl.format)}`}
                >
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${accentGradient(wl.format)} to-transparent`}
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <h2 className="truncate text-xl font-black tracking-tight group-hover:text-white">
                            {wl.title}
                          </h2>
                          <ColorPips colors={wl.color_identity} />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="bg-primary/30 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white">
                            {wl.owner.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            {wl.owner.username}
                          </span>
                          {wl.owner.city && (
                            <span className="text-muted-foreground text-sm">
                              {wl.owner.city}, {wl.owner.province}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {priceRange(wl) && (
                          <span className="text-primary text-xl font-black">
                            {priceRange(wl)}
                          </span>
                        )}
                      </div>
                    </div>

                    {wl.description && (
                      <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
                        {wl.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {wl.format && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${FORMAT_COLORS[wl.format] ?? 'border-white/20 text-white/60'}`}
                        >
                          {wl.format}
                        </span>
                      )}
                      {wl.archetype && (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/60">
                          {wl.archetype}
                        </span>
                      )}
                      {wl.commander_name && (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/60">
                          {wl.commander_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <PaginationNav
            page={safePage}
            totalPages={totalPages}
            buildUrl={(p) =>
              p === 1 ? '/want-lists' : `/want-lists?page=${p}`
            }
          />
        </>
      )}
    </main>
  )
}
