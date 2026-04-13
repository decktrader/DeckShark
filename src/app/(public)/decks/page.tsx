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

export const metadata = {
  title: 'Browse Decks — DeckShark',
  description: 'Find MTG decks available for trade across Canada.',
}

const PAGE_SIZE = 24

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

function DeckCard({ deck }: { deck: PublicDeck }) {
  const commanderLabel = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  return (
    <Link href={`/decks/${deck.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5">
        {/* Art section — name overlaid */}
        <div className="relative">
          <DeckArt
            commanderScryfallId={deck.commander_scryfall_id}
            partnerScryfallId={deck.partner_commander_scryfall_id}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Name + commander on art */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="truncate text-sm font-bold text-white drop-shadow-lg">
              {deck.name}
            </p>
            {commanderLabel && (
              <p className="truncate text-xs text-white/50">{commanderLabel}</p>
            )}
          </div>
        </div>

        {/* Info bar below art */}
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-4 py-2.5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            {deck.owner.avatar_url ? (
              <Image
                src={deck.owner.avatar_url}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="bg-primary/40 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
                {deck.owner.username.charAt(0).toUpperCase()}
              </div>
            )}
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
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-emerald-400">
              {formatPrice(deck.estimated_value_cents)}
            </p>
            <p className="text-muted-foreground text-[10px] capitalize">
              {deck.format}
            </p>
          </div>
        </div>
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
      <div className="flex gap-6">
        <Suspense>
          <BrowseSidebar
            resultCount={totalDecks}
            defaultCity={defaultCity}
            defaultProvince={defaultProvince}
          />
        </Suspense>

        {/* Main content */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight">Browse decks</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {totalDecks} deck{totalDecks !== 1 ? 's' : ''} available for trade
            </p>
          </div>

          {pageDecks.length === 0 ? (
            <p className="text-muted-foreground py-20 text-center text-lg">
              No decks match your filters. Try broadening your search.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageDecks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} />
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
