import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import {
  getPublicDeck,
  getDeckCards,
  getDeckPhotos,
} from '@/lib/services/decks.server'
import { getPowerLevelLabel } from '@/lib/constants'
import {
  DeckCardList,
  DeckCardListProvider,
  DeckCardPreview,
} from '@/components/deck/deck-card-list'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DeckArt } from '@/components/deck/deck-art'
import { Button } from '@/components/ui/button'
import { ReportButton } from '@/components/report-button'
import { InterestToggle } from '@/components/deck/interest-toggle'
import { getUserById } from '@/lib/services/users.server'
import { Info } from 'lucide-react'
import {
  getInterestCount,
  hasUserInterest,
} from '@/lib/services/deck-interests.server'

const FORMAT_COLORS: Record<string, string> = {
  commander: 'border-violet-500/40 text-violet-300',
  modern: 'border-sky-500/40 text-sky-300',
  standard: 'border-amber-500/40 text-amber-300',
  legacy: 'border-rose-500/40 text-rose-300',
  pauper: 'border-emerald-500/40 text-emerald-300',
  pioneer: 'border-orange-500/40 text-orange-300',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { data: deck } = await getPublicDeck(id)
  if (!deck) return {}
  const title = deck.commander_name
    ? `${deck.name} — ${deck.commander_name} | DeckShark`
    : `${deck.name} | DeckShark`
  const description = `${deck.format} deck listed for trade by ${deck.owner.username}${deck.owner.city ? ` in ${deck.owner.city}` : ''}.`
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

export default async function PublicDeckPage({
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

  const { data: deck } = await getPublicDeck(id)

  if (!deck) notFound()

  const [
    { data: cards },
    { data: photos },
    { data: interestCount },
    { data: userInterested },
  ] = await Promise.all([
    getDeckCards(deck.id),
    getDeckPhotos(deck.id),
    getInterestCount(deck.id),
    authUser
      ? hasUserInterest(authUser.id, deck.id)
      : Promise.resolve({ data: false, error: null }),
  ])

  // Fetch viewer's profile to determine locality
  const { data: viewerProfile } = authUser
    ? await getUserById(authUser.id)
    : { data: null }

  const isOwner = authUser?.id === deck.user_id
  const canPropose = !!authUser && !isOwner
  const isLocal =
    !!viewerProfile?.city &&
    !!deck.owner.city &&
    viewerProfile.city.toLowerCase() === deck.owner.city.toLowerCase()

  const primaryPhoto = photos?.find((p) => p.is_primary) ?? photos?.[0]
  const photoUrl = primaryPhoto
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/deck-photos/${primaryPhoto.storage_path}`
    : null

  const initials = deck.owner.username.slice(0, 2).toUpperCase()
  const totalCards = (cards ?? []).reduce((sum, c) => sum + c.quantity, 0)

  const accentGradient = (() => {
    switch (deck.format) {
      case 'commander':
        return 'from-violet-500/80'
      case 'modern':
        return 'from-sky-500/80'
      case 'standard':
        return 'from-amber-500/80'
      case 'legacy':
        return 'from-rose-500/80'
      case 'pauper':
        return 'from-emerald-500/80'
      default:
        return 'from-white/30'
    }
  })()

  const statItems = [
    {
      label: 'Value',
      value: formatPrice(deck.estimated_value_cents),
      highlight: true,
    },
    { label: 'Cards', value: `${totalCards}` },
    ...(deck.archetype ? [{ label: 'Archetype', value: deck.archetype }] : []),
    ...(deck.power_level
      ? [{ label: 'Bracket', value: getPowerLevelLabel(deck.power_level)! }]
      : []),
  ]

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4">
        <Link
          href="/decks"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Browse decks
        </Link>
      </div>

      {/* Hero + info bar */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/5">
        {deck.commander_scryfall_id ? (
          <div className="relative">
            <DeckArt
              commanderScryfallId={deck.commander_scryfall_id}
              partnerScryfallId={deck.partner_commander_scryfall_id}
              aspect="h-48 sm:h-64"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h1 className="text-3xl font-black text-white drop-shadow-lg">
                {deck.name}
              </h1>
              {deck.commander_name && (
                <p className="mt-1 text-sm text-white/60">
                  {[deck.commander_name, deck.partner_commander_name]
                    .filter(Boolean)
                    .join(' / ')}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h1 className="text-3xl font-black tracking-tight">{deck.name}</h1>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-white/[3%] px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${deck.owner.username}`}
              className="flex items-center gap-2 hover:underline"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={deck.owner.avatar_url ?? undefined}
                  alt={deck.owner.username}
                />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{deck.owner.username}</span>
            </Link>
            {deck.owner.completed_trades > 0 && (
              <span className="text-xs text-yellow-400">
                {Number(deck.owner.trade_rating).toFixed(1)} ★
              </span>
            )}
            {deck.owner.city && (
              <span className="text-muted-foreground text-xs">
                {deck.owner.city}, {deck.owner.province}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${FORMAT_COLORS[deck.format] ?? 'border-white/20 text-white/60'}`}
            >
              {deck.format}
            </span>
          </div>
        </div>
      </div>

      <DeckCardListProvider cards={cards ?? []}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {deck.description && (
              <p className="text-muted-foreground">{deck.description}</p>
            )}

            {/* Stat pills with accent bars */}
            <div className="flex flex-wrap gap-3">
              {statItems.map((s) => (
                <div
                  key={s.label}
                  className="overflow-hidden rounded-lg border border-white/5"
                >
                  <div
                    className={`h-0.5 w-full bg-gradient-to-r ${accentGradient} to-transparent`}
                  />
                  <div className="px-5 py-3 text-center">
                    <p
                      className={`text-lg font-bold capitalize ${s.highlight ? 'text-primary' : ''}`}
                    >
                      {s.value}
                    </p>
                    <p className="text-muted-foreground text-xs">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {deck.condition_notes && (
              <div className="rounded-lg border border-white/5 p-4">
                <h2 className="mb-1 text-sm font-semibold">Condition notes</h2>
                <p className="text-muted-foreground text-sm">
                  {deck.condition_notes}
                </p>
              </div>
            )}

            {photoUrl && (
              <div className="relative h-64 w-full overflow-hidden rounded-xl">
                <Image
                  src={photoUrl}
                  alt={deck.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/[2%] to-transparent">
              <div className="px-6 py-4">
                <h2 className="text-lg font-bold">Decklist</h2>
              </div>
              <div className="px-6 pb-6">
                <DeckCardList cards={cards ?? []} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="space-y-3 lg:sticky lg:top-24">
              {/* Card preview — sticky, follows scroll */}
              <div className="hidden lg:block">
                <DeckCardPreview />
              </div>

              {(deck.includes_sleeves || deck.includes_deckbox) && (
                <div className="rounded-xl border border-white/5 p-4">
                  <div className="flex gap-1.5">
                    {deck.includes_sleeves && (
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/60">
                        Sleeves
                      </span>
                    )}
                    {deck.includes_deckbox && (
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/60">
                        Deckbox
                      </span>
                    )}
                  </div>
                </div>
              )}
              {!isOwner && !isLocal && (
                <InterestToggle
                  deckId={deck.id}
                  userId={authUser?.id ?? null}
                  initialInterested={!!userInterested}
                  initialCount={interestCount ?? 0}
                />
              )}
              {canPropose && (
                <div className="space-y-1">
                  <Button
                    className="w-full"
                    variant={isLocal ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href={`/trades/new?deckId=${deck.id}`}>
                      Propose trade
                    </Link>
                  </Button>
                  {!isLocal && deck.owner.city && (
                    <p className="flex items-center justify-center gap-1 text-[10px] text-amber-400/80">
                      <Info className="h-3 w-3" />
                      This trader is in {deck.owner.city} — local meetup
                      required
                    </p>
                  )}
                </div>
              )}
              {!authUser && (
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/login?next=/decks/${deck.id}`}>
                    Sign in to propose trade
                  </Link>
                </Button>
              )}
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/profile/${deck.owner.username}`}>
                  View {deck.owner.username}&apos;s profile
                </Link>
              </Button>
              {authUser && !isOwner && (
                <div className="pt-2">
                  <ReportButton targetType="deck" targetId={deck.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </DeckCardListProvider>
    </main>
  )
}
