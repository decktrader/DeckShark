import Link from 'next/link'
import { getPublicWantLists } from '@/lib/services/wantlists.server'
import type { WantListWithOwner } from '@/lib/services/wantlists.server'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ds/tag'
import { Pfp } from '@/components/ds/pfp'
import { ColorPips } from '@/components/deck/color-pips'
import { PaginationNav } from '@/components/ui/pagination-nav'
import { formatPrice } from '@/lib/utils'

function priceRange(wl: WantListWithOwner): string {
  const opts = { decimals: false } as const
  if (!wl.min_value_cents && !wl.max_value_cents) return ''
  if (!wl.min_value_cents)
    return `Up to ${formatPrice(wl.max_value_cents, opts)}`
  if (!wl.max_value_cents) return `${formatPrice(wl.min_value_cents, opts)}+`
  return `${formatPrice(wl.min_value_cents, opts)} – ${formatPrice(wl.max_value_cents, opts)}`
}

export const revalidate = 300 // 5 minutes

export const metadata = {
  title: 'Want Lists — DeckShark',
  description: 'See what MTG decks traders across Canada and the US are after.',
}

const PAGE_SIZE = 20

export default async function WantListsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))

  const { data: result } = await getPublicWantLists({
    page,
    pageSize: PAGE_SIZE,
  })
  const pageItems = result?.wantLists ?? []
  const totalWantLists = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalWantLists / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  return (
    <main className="mx-auto max-w-[1180px] px-[30px] pt-6 pb-[60px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <span className="text-terra-deep flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
            <span className="animate-beat bg-terra h-2 w-2 rounded-full" />
            What players are hunting
          </span>
          <h1 className="font-display mt-1.5 text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.02em]">
            Want lists
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            <b className="text-terra-deep font-bold">
              {totalWantLists.toLocaleString('en-US')}
            </b>{' '}
            open want list{totalWantLists !== 1 ? 's' : ''}. Have a match? Reach
            out and set up a trade.
          </p>
        </div>
        <Button asChild variant="terra">
          <Link href="/want-lists/new">Post your want list</Link>
        </Button>
      </div>

      {totalWantLists === 0 ? (
        <p className="text-ink-2 py-20 text-center text-lg">
          No want lists yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {pageItems.map((wl) => (
              <Link
                key={wl.id}
                href={`/want-lists/${wl.id}`}
                className="border-line border-l-terra hover:shadow-card block rounded-md border border-l-[3px] bg-white px-[15px] py-[13px] transition-[transform,box-shadow] hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="font-display truncate text-[15.5px] leading-tight font-bold tracking-[-0.01em]">
                      {wl.title}
                    </h2>
                    {wl.color_identity && wl.color_identity.length > 0 && (
                      <ColorPips
                        colors={wl.color_identity}
                        size={15}
                        className="flex shrink-0"
                      />
                    )}
                  </div>
                  {priceRange(wl) && (
                    <span className="text-ink shrink-0 font-mono text-[13.5px] font-semibold whitespace-nowrap">
                      {priceRange(wl)}
                    </span>
                  )}
                </div>

                <div className="text-slate mt-2.5 flex flex-wrap items-center gap-2 text-[11.5px]">
                  <Pfp
                    src={wl.owner.avatar_url}
                    name={wl.owner.username}
                    size={22}
                  />
                  <span className="text-ink-2 font-semibold">
                    {wl.owner.username}
                  </span>
                  {wl.owner.city && (
                    <span>
                      {wl.owner.city}
                      {wl.owner.province ? `, ${wl.owner.province}` : ''}
                    </span>
                  )}
                </div>

                {(wl.format || wl.archetype || wl.commander_name) && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {wl.format && (
                      <Tag
                        variant="terra"
                        className="px-2 py-[3px] text-[10.5px] capitalize"
                      >
                        {wl.format}
                      </Tag>
                    )}
                    {wl.archetype && (
                      <Tag
                        variant="slate"
                        className="px-2 py-[3px] text-[10.5px]"
                      >
                        {wl.archetype}
                      </Tag>
                    )}
                    {wl.commander_name && (
                      <Tag
                        variant="slate"
                        className="px-2 py-[3px] text-[10.5px]"
                      >
                        {wl.commander_name}
                      </Tag>
                    )}
                  </div>
                )}
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
