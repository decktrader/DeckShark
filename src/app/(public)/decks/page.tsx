import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPublicDecks } from '@/lib/services/decks.server'
import type { PublicDeck } from '@/lib/services/decks.server'
import { getUserById } from '@/lib/services/users.server'
import { createClient } from '@/lib/supabase/server'
import { BrowseSidebar } from '@/components/deck/browse-sidebar'
import { DeckArt } from '@/components/deck/deck-art'
import { getPowerLevelLabel } from '@/lib/constants'
import { PaginationNav } from '@/components/ui/pagination-nav'
import { getInterestCountsForDecks } from '@/lib/services/deck-interests.server'
import { Heart } from 'lucide-react'

export const metadata = {
  title: 'Browse Decks — DeckShark',
  description: 'Find MTG decks available for trade across Canada.',
}

const PAGE_SIZE = 24

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

function DeckCard({
  deck,
  interestCount,
  listView,
}: {
  deck: PublicDeck
  interestCount: number
  listView?: boolean
}) {
  const commanderLabel = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  const ownerInitial = deck.owner.username.charAt(0).toUpperCase()
  const location = deck.owner.city
    ? deck.owner.city
    : (deck.owner.province ?? '')

  const avatar = deck.owner.avatar_url ? (
    <Image
      src={deck.owner.avatar_url}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="bg-primary/40 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white">
      {ownerInitial}
    </div>
  )

  return (
    <Link href={`/decks/${deck.id}`} className="group block">
      {/* Mobile: compact V4D grid card */}
      {!listView && (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[3%] p-2.5 transition-all hover:border-white/15 lg:hidden">
          <div className="flex gap-2.5">
            {deck.commander_scryfall_id ? (
              <img
                src={`https://cards.scryfall.io/art_crop/front/${deck.commander_scryfall_id[0]}/${deck.commander_scryfall_id[1]}/${deck.commander_scryfall_id}.jpg`}
                alt={deck.commander_name ?? ''}
                className="h-14 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
              />
            ) : (
              <div className="bg-muted h-14 w-14 shrink-0 rounded-lg" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{deck.name}</p>
              {commanderLabel && (
                <p className="text-muted-foreground truncate text-[10px]">
                  {commanderLabel}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1">
                <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] text-violet-300 capitalize">
                  {deck.format}
                </span>
                {location && (
                  <span className="text-[9px] text-white/30">{location}</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {avatar}
              <span className="text-[10px]">{deck.owner.username}</span>
            </div>
            <p className="text-lg font-extrabold text-emerald-400">
              {formatPrice(deck.estimated_value_cents)}
            </p>
          </div>
        </div>
      )}

      {/* Mobile: compact list row */}
      {listView && (
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-1 py-1.5 lg:hidden">
          {deck.commander_scryfall_id ? (
            <img
              src={`https://cards.scryfall.io/art_crop/front/${deck.commander_scryfall_id[0]}/${deck.commander_scryfall_id[1]}/${deck.commander_scryfall_id}.jpg`}
              alt={deck.commander_name ?? ''}
              className="h-8 w-8 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="bg-muted h-8 w-8 shrink-0 rounded" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <p className="truncate text-[12px] font-semibold">{deck.name}</p>
              <span className="shrink-0 text-[9px] text-violet-300 capitalize">
                {deck.format}
              </span>
            </div>
            <p className="text-muted-foreground truncate text-[10px]">
              {commanderLabel ? `${commanderLabel} · ` : ''}
              {deck.owner.username}
              {location ? ` · ${location}` : ''}
            </p>
          </div>
          <p className="shrink-0 text-[13px] font-bold text-emerald-400">
            {formatPrice(deck.estimated_value_cents)}
          </p>
        </div>
      )}

      {/* Desktop: full art card */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5 lg:block">
        <div className="relative">
          <DeckArt
            commanderScryfallId={deck.commander_scryfall_id}
            partnerScryfallId={deck.partner_commander_scryfall_id}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="truncate text-sm font-bold text-white drop-shadow-lg">
              {deck.name}
            </p>
            {commanderLabel && (
              <p className="truncate text-xs text-white/50">{commanderLabel}</p>
            )}
          </div>
        </div>
        <div className="border-t border-white/5 bg-white/[3%] px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {avatar}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {deck.owner.username}
              </p>
              <p className="text-muted-foreground truncate text-[10px]">
                {deck.owner.city && deck.owner.province
                  ? `${deck.owner.city}, ${deck.owner.province}`
                  : (deck.owner.province ?? '')}
              </p>
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-lg font-bold text-emerald-400">
              {formatPrice(deck.estimated_value_cents)}
            </p>
            <p className="text-muted-foreground text-[10px] capitalize">
              {deck.format}
            </p>
          </div>
        </div>
        {interestCount > 0 && (
          <div className="flex items-center gap-1 border-t border-white/5 bg-white/[2%] px-4 py-1.5">
            <Heart className="h-3 w-3 text-pink-400" />
            <span className="text-[10px] text-pink-400/80">
              {interestCount} interested
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default async function BrowseDecksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))

  // Fetch the authenticated user's profile city/province to use as defaults
  let defaultCity: string | null = null
  let defaultProvince: string | null = null
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await getUserById(authUser.id)
      defaultCity = profile?.city ?? null
      defaultProvince = profile?.province ?? null
    }
  } catch {
    // Non-critical — browse page works fine without defaults
  }

  const colorIdentity = params.colorIdentity
    ? params.colorIdentity.split(',').filter(Boolean)
    : undefined

  const { data: result } = await getPublicDecks({
    format: params.format,
    province: params.province,
    city: params.city,
    commander: params.commander,
    q: params.q,
    minValueCents: params.minValue ? Number(params.minValue) : undefined,
    maxValueCents: params.maxValue ? Number(params.maxValue) : undefined,
    powerLevel: params.powerLevel,
    colorIdentity,
    archetype: params.archetype,
    sortBy: params.sortBy as
      | import('@/lib/services/decks.server').SortOption
      | undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const pageDecks = result?.decks ?? []
  const totalDecks = result?.total ?? 0

  // Batch-fetch interest counts for this page of decks
  const { data: interestCounts } = await getInterestCountsForDecks(
    pageDecks.map((d) => d.id),
  )
  const totalPages = Math.max(1, Math.ceil(totalDecks / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  function buildUrl(p: number) {
    const qs = new URLSearchParams()
    if (params.format) qs.set('format', params.format)
    if (params.province) qs.set('province', params.province)
    if (params.city) qs.set('city', params.city)
    if (params.commander) qs.set('commander', params.commander)
    if (params.minValue) qs.set('minValue', params.minValue)
    if (params.maxValue) qs.set('maxValue', params.maxValue)
    if (params.powerLevel) qs.set('powerLevel', params.powerLevel)
    if (params.colorIdentity) qs.set('colorIdentity', params.colorIdentity)
    if (params.archetype) qs.set('archetype', params.archetype)
    if (params.sortBy) qs.set('sortBy', params.sortBy)
    if (p > 1) qs.set('page', String(p))
    const str = qs.toString()
    return str ? `/decks?${str}` : '/decks'
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl font-black tracking-tight lg:text-3xl">
          Browse decks
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {totalDecks} deck{totalDecks !== 1 ? 's' : ''} available for trade
        </p>
      </div>

      {/* Mobile filter bar — above the grid */}
      <div className="mb-4 lg:hidden">
        <Suspense>
          <BrowseSidebar
            resultCount={totalDecks}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
            mobileOnly
          />
        </Suspense>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <Suspense>
          <BrowseSidebar
            resultCount={totalDecks}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
            desktopOnly
          />
        </Suspense>

        {/* Main content */}
        <div className="flex-1">
          {pageDecks.length === 0 ? (
            <p className="text-muted-foreground py-20 text-center text-lg">
              No decks match your filters. Try broadening your search.
            </p>
          ) : (
            <>
              <div
                className={
                  params.view === 'list'
                    ? 'flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 xl:grid-cols-4'
                    : 'grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4'
                }
              >
                {pageDecks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    interestCount={interestCounts?.[deck.id] ?? 0}
                    listView={params.view === 'list'}
                  />
                ))}
              </div>
              <PaginationNav
                page={safePage}
                totalPages={totalPages}
                buildUrl={buildUrl}
              />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
