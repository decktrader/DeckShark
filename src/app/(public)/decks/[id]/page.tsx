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
import { Pfp } from '@/components/ds/pfp'
import { ColorPips } from '@/components/deck/color-pips'
import { DeckArt } from '@/components/deck/deck-art'
import { Button } from '@/components/ui/button'
import { ReportButton } from '@/components/report-button'
import { InterestToggle } from '@/components/deck/interest-toggle'
import { InterestToggleMobile } from '@/components/deck/interest-toggle-mobile'
import { getUserById } from '@/lib/services/users.server'
import { Info } from 'lucide-react'
import {
  getInterestCount,
  hasUserInterest,
} from '@/lib/services/deck-interests.server'
import { formatPrice } from '@/lib/utils'

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

  const totalCards = (cards ?? []).reduce((sum, c) => sum + c.quantity, 0)

  const statItems = [
    {
      label: 'Value',
      value: formatPrice(deck.estimated_value_cents, { decimals: false }),
      highlight: true,
    },
    { label: 'Cards', value: `${totalCards}` },
    ...(deck.archetype ? [{ label: 'Archetype', value: deck.archetype }] : []),
    ...(deck.power_level
      ? [{ label: 'Bracket', value: getPowerLevelLabel(deck.power_level)! }]
      : []),
  ]

  const location = [deck.owner.city, deck.owner.province]
    .filter(Boolean)
    .join(', ')
  const commander = [deck.commander_name, deck.partner_commander_name]
    .filter(Boolean)
    .join(' / ')

  return (
    <main className="mx-auto max-w-[1080px] px-[30px] pt-[22px] pb-32 lg:pb-[60px]">
      <Link
        href="/decks"
        className="text-ink-2 hover:text-ink text-sm font-semibold"
      >
        ← Browse decks
      </Link>

      {/* Hero + info bar */}
      <div className="rounded-card-lg border-line mt-3.5 overflow-hidden border bg-white">
        {deck.commander_scryfall_id ? (
          <div className="relative h-[260px] bg-[#0c2030]">
            <DeckArt
              commanderScryfallId={deck.commander_scryfall_id}
              partnerScryfallId={deck.partner_commander_scryfall_id}
              aspect="absolute inset-0 h-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[35%] to-[rgba(8,12,18,0.92)]" />
            {deck.color_identity?.length > 0 && (
              <ColorPips
                colors={deck.color_identity}
                onArt
                size={20}
                className="absolute top-3.5 right-3.5 z-[2] flex"
              />
            )}
            <div className="absolute inset-x-6 bottom-5 z-[2]">
              <h1 className="font-display text-paper text-[clamp(28px,3.6vw,40px)] leading-none font-bold tracking-[-0.02em]">
                {deck.name}
              </h1>
              {commander && (
                <p className="text-paper/70 mt-1.5 text-sm">{commander}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {deck.name}
            </h1>
          </div>
        )}
        <div className="border-line bg-paper-2 flex flex-wrap items-center justify-between gap-3.5 border-t px-[18px] py-3.5">
          <div className="flex items-center gap-2.5">
            <Link
              href={`/profile/${deck.owner.username}`}
              className="flex items-center gap-2.5"
            >
              <Pfp
                src={deck.owner.avatar_url}
                name={deck.owner.username}
                size={30}
              />
              <span className="text-ink text-sm font-bold hover:underline">
                {deck.owner.username}
              </span>
            </Link>
            {deck.owner.completed_trades > 0 && (
              <span className="text-brass-deep font-mono text-xs font-semibold">
                {Number(deck.owner.trade_rating).toFixed(1)} stars
              </span>
            )}
            {location && <span className="text-slate text-xs">{location}</span>}
          </div>
          <span className="rounded-pill border-teal/30 bg-teal/[0.08] text-teal-deep border px-[11px] py-1 font-mono text-[10.5px] tracking-[0.06em] uppercase">
            {deck.format}
          </span>
        </div>
      </div>

      <DeckCardListProvider cards={cards ?? []}>
        <div className="mt-6 grid items-start gap-[26px] lg:grid-cols-[1fr_312px]">
          <div>
            {deck.description && (
              <p className="text-ink-2 text-[15px] leading-relaxed">
                {deck.description}
              </p>
            )}

            {/* Stat pills with terra accent bars */}
            <div className="mt-[18px] flex flex-wrap gap-3">
              {statItems.map((s) => (
                <div
                  key={s.label}
                  className="border-line min-w-[104px] flex-1 overflow-hidden rounded-lg border bg-white"
                >
                  <div className="from-terra h-[3px] w-full bg-gradient-to-r to-transparent" />
                  <div className="px-4 py-3 text-center">
                    <p
                      className={
                        s.highlight
                          ? 'text-teal-deep font-mono text-[19px] font-semibold'
                          : 'font-display text-[19px] font-bold capitalize'
                      }
                    >
                      {s.value}
                    </p>
                    <p className="text-slate mt-0.5 text-[11px]">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-ink-3 mt-2.5 font-mono text-[11.5px]">
              All values in USD via Scryfall market data
            </p>

            {(deck.condition_notes ||
              deck.includes_sleeves ||
              deck.includes_deckbox) && (
              <div className="border-line mt-[18px] rounded-lg border bg-white p-4">
                <h2 className="font-display text-ink text-sm font-bold">
                  Condition notes
                </h2>
                {deck.condition_notes && (
                  <p className="text-ink-2 mt-1.5 text-[13.5px]">
                    {deck.condition_notes}
                  </p>
                )}
                {(deck.includes_sleeves || deck.includes_deckbox) && (
                  <div className="mt-3 flex gap-1.5">
                    {deck.includes_sleeves && (
                      <span className="border-line bg-paper-2 text-ink-2 rounded-sm border px-2.5 py-1 font-mono text-[10.5px]">
                        Sleeves included
                      </span>
                    )}
                    {deck.includes_deckbox && (
                      <span className="border-line bg-paper-2 text-ink-2 rounded-sm border px-2.5 py-1 font-mono text-[10.5px]">
                        Deckbox included
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {photoUrl && (
              <div className="rounded-card border-line relative mt-[18px] h-64 w-full overflow-hidden border">
                <Image
                  src={photoUrl}
                  alt={deck.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="border-line mt-[18px] overflow-hidden rounded-lg border bg-white">
              <div className="border-line flex items-center justify-between border-b px-[18px] py-3.5">
                <h2 className="font-display text-ink text-[17px] font-bold">
                  Decklist
                </h2>
                <span className="text-slate font-mono text-[11.5px]">
                  {totalCards} cards
                </span>
              </div>
              <DeckCardList cards={cards ?? []} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden flex-col gap-3 lg:sticky lg:top-[84px] lg:flex">
            <div className="hidden lg:block">
              <DeckCardPreview />
            </div>

            {canPropose && (
              <>
                <Button asChild variant="terra" className="w-full">
                  <Link href={`/trades/new?deckId=${deck.id}`}>
                    Propose trade
                  </Link>
                </Button>
                {!isLocal && deck.owner.city && (
                  <p className="text-brass-deep flex items-center justify-center gap-1.5 text-[11px]">
                    <Info className="h-3 w-3" />
                    This trader is in {deck.owner.city}, local meetup required
                  </p>
                )}
              </>
            )}
            {!authUser && (
              <Button asChild variant="terra" className="w-full">
                <Link href={`/login?next=/decks/${deck.id}`}>
                  Sign in to propose trade
                </Link>
              </Button>
            )}
            {!isOwner && !isLocal && (
              <InterestToggle
                deckId={deck.id}
                userId={authUser?.id ?? null}
                initialInterested={!!userInterested}
                initialCount={interestCount ?? 0}
              />
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href={`/profile/${deck.owner.username}`}>
                View {deck.owner.username}&apos;s profile
              </Link>
            </Button>
            {authUser && !isOwner && (
              <div className="pt-1 text-center">
                <ReportButton targetType="deck" targetId={deck.id} />
              </div>
            )}
          </aside>
        </div>
      </DeckCardListProvider>

      {/* Mobile sticky action bar */}
      {!isOwner && (
        <div className="border-line bg-paper/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur-md lg:hidden">
          {canPropose && (
            <Button asChild variant="terra" className="w-full">
              <Link href={`/trades/new?deckId=${deck.id}`}>Propose trade</Link>
            </Button>
          )}
          {!authUser && (
            <Button asChild variant="terra" className="w-full">
              <Link href={`/login?next=/decks/${deck.id}`}>
                Sign in to propose trade
              </Link>
            </Button>
          )}
          {!isLocal && (
            <InterestToggleMobile
              deckId={deck.id}
              userId={authUser?.id ?? null}
              initialInterested={!!userInterested}
              initialCount={interestCount ?? 0}
            />
          )}
        </div>
      )}
    </main>
  )
}
