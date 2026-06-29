import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { getWantList, getMatchingDecks } from '@/lib/services/wantlists.server'
import { getPowerLevelLabel } from '@/lib/constants'
import { DeckArt } from '@/components/deck/deck-art'
import { ColorPips } from '@/components/deck/color-pips'
import { Pfp } from '@/components/ds/pfp'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

function CriteriaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line bg-paper-2 rounded-md border px-3 py-2">
      <p className="text-slate font-mono text-[9.5px] tracking-[0.1em] uppercase">
        {label}
      </p>
      <p className="text-ink mt-0.5 text-[13.5px] font-semibold">{value}</p>
    </div>
  )
}

export default async function PublicWantListPage({
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

  const { data: wantList } = await getWantList(id)
  if (!wantList) notFound()

  const isOwner = authUser && wantList.user_id === authUser.id
  const { data: matches } = await getMatchingDecks(wantList)

  const criteria: { label: string; value: string }[] = []
  if (wantList.format)
    criteria.push({ label: 'Format', value: wantList.format })
  if (wantList.archetype)
    criteria.push({ label: 'Archetype', value: wantList.archetype })
  if (wantList.commander_name)
    criteria.push({ label: 'Commander', value: wantList.commander_name })
  if (wantList.power_level)
    criteria.push({
      label: 'Power',
      value: getPowerLevelLabel(wantList.power_level) ?? wantList.power_level,
    })
  if (wantList.min_value_cents || wantList.max_value_cents)
    criteria.push({
      label: 'Budget',
      value: `${formatPrice(wantList.min_value_cents, { decimals: false })} – ${wantList.max_value_cents ? formatPrice(wantList.max_value_cents, { decimals: false }) : 'any'}`,
    })

  const location = [wantList.owner.city, wantList.owner.province]
    .filter(Boolean)
    .join(', ')

  return (
    <main className="mx-auto max-w-[880px] px-[30px] pt-[22px] pb-[60px]">
      <Link
        href="/want-lists"
        className="text-ink-2 hover:text-ink text-sm font-semibold"
      >
        ← All want lists
      </Link>

      {/* Header */}
      <div className="border-line border-l-terra mt-3.5 rounded-lg border border-l-[4px] bg-white p-[22px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Pfp
              src={wantList.owner.avatar_url}
              name={wantList.owner.username}
              size={52}
            />
            <div>
              <h1 className="font-display text-[clamp(22px,2.8vw,28px)] leading-tight font-bold tracking-[-0.02em]">
                {wantList.title}
              </h1>
              <p className="text-slate mt-1 text-[13px]">
                <b className="text-ink font-semibold">
                  {wantList.owner.username}
                </b>
                {location ? ` · ${location}` : ''}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {authUser && !isOwner && (
              <Button asChild variant="terra" size="sm">
                <Link href={`/profile/${wantList.owner.username}`}>
                  Propose a trade
                </Link>
              </Button>
            )}
            {!authUser && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/login?next=/want-lists/${id}`}>
                  Sign in to trade
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

        {criteria.length > 0 && (
          <div className="mt-[18px] flex flex-wrap gap-2.5">
            {criteria.map((c) => (
              <CriteriaPill key={c.label} label={c.label} value={c.value} />
            ))}
          </div>
        )}

        {wantList.description && (
          <p className="border-line text-ink-2 mt-[18px] border-t pt-4 text-sm leading-relaxed">
            {wantList.description}
          </p>
        )}
      </div>

      {/* Matching decks */}
      <div className="mt-[30px] mb-4 flex items-baseline gap-2.5">
        <h2 className="font-display text-[19px] font-bold tracking-[-0.01em]">
          Matching decks
        </h2>
        {matches && matches.length > 0 && (
          <span className="text-teal-deep font-mono text-xs">
            {matches.length}
          </span>
        )}
      </div>

      {!matches || matches.length === 0 ? (
        <p className="text-ink-2 text-sm">
          No decks currently match this want list. Check back later.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((deck) => {
            const commanderLabel = [
              deck.commander_name,
              deck.partner_commander_name,
            ]
              .filter(Boolean)
              .join(' / ')
            return (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="group border-line hover:border-line-2 hover:shadow-card block overflow-hidden rounded-lg border bg-white transition-[transform,box-shadow,border-color] hover:-translate-y-[3px]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#0c2030]">
                  <DeckArt
                    commanderScryfallId={deck.commander_scryfall_id}
                    partnerScryfallId={deck.partner_commander_scryfall_id}
                    aspect="absolute inset-0 h-full"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[42%] to-[rgba(8,12,18,0.86)]" />
                  <span className="bg-terra text-paper absolute top-2 left-2 z-[2] rounded-sm px-[7px] py-[3px] font-mono text-[9px] font-semibold tracking-[0.05em] uppercase">
                    Match
                  </span>
                  {deck.color_identity?.length > 0 && (
                    <ColorPips
                      colors={deck.color_identity}
                      onArt
                      size={16}
                      className="absolute top-2 right-2 z-[2] flex"
                    />
                  )}
                  <div className="absolute inset-x-3 bottom-2.5 z-[2]">
                    <p className="font-display text-paper truncate text-[13.5px] font-bold">
                      {deck.name}
                    </p>
                    {commanderLabel && (
                      <p className="text-paper/60 truncate text-[10.5px]">
                        {commanderLabel}
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-line flex items-center justify-between border-t px-3 py-2">
                  <div className="text-slate truncate text-[11px]">
                    {deck.owner.username}
                    {deck.owner.city ? ` · ${deck.owner.city}` : ''}
                  </div>
                  <div className="text-teal-deep font-mono text-sm font-semibold">
                    {formatPrice(deck.estimated_value_cents, {
                      decimals: false,
                    })}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
