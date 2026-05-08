import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { getWantList, getMatchingDecks } from '@/lib/services/wantlists.server'
import { getPowerLevelLabel } from '@/lib/constants'
import { DeckArt } from '@/components/deck/deck-art'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return '\u2014'
  return `$${(cents / 100).toFixed(2)}`
}

function CriteriaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-lg px-3 py-2">
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
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
      value: `${formatPrice(wantList.min_value_cents)} – ${wantList.max_value_cents ? formatPrice(wantList.max_value_cents) : 'any'}`,
    })

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/want-lists"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        All want lists
      </Link>

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-white/5 bg-white/[2%] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {wantList.owner.avatar_url ? (
              <img
                src={wantList.owner.avatar_url}
                alt=""
                className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="bg-primary/20 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-white/10">
                {wantList.owner.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {wantList.title}
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                <span className="font-medium text-white/80">
                  {wantList.owner.username}
                </span>
                {wantList.owner.city &&
                  ` · ${wantList.owner.city}, ${wantList.owner.province}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {authUser && !isOwner && (
              <Button asChild>
                <Link href={`/profile/${wantList.owner.username}`}>
                  Propose a trade
                </Link>
              </Button>
            )}
            {!authUser && (
              <Button asChild variant="outline">
                <Link href={`/login?next=/want-lists/${id}`}>
                  Sign in to trade
                </Link>
              </Button>
            )}
            {isOwner && (
              <Button asChild variant="outline">
                <Link href={`/want-lists/${id}/edit`}>Edit</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Criteria pills */}
        {criteria.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {criteria.map((c) => (
              <CriteriaPill key={c.label} label={c.label} value={c.value} />
            ))}
          </div>
        )}

        {/* Description */}
        {wantList.description && (
          <>
            <Separator className="my-5" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              {wantList.description}
            </p>
          </>
        )}
      </div>

      {/* Matching decks */}
      <h2 className="mb-4 text-lg font-bold">
        Matching decks
        {matches && matches.length > 0 && (
          <span className="text-muted-foreground ml-2 text-sm font-normal">
            ({matches.length})
          </span>
        )}
      </h2>

      {!matches || matches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No decks currently match this want list. Check back later.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                className="group block"
              >
                <div className="overflow-hidden rounded-2xl border border-white/5 transition-all hover:border-white/15">
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
                        <p className="truncate text-xs text-white/50">
                          {commanderLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 bg-white/[3%] px-4 py-2.5">
                    <div className="text-muted-foreground text-xs">
                      {deck.owner.username}
                      {deck.owner.city &&
                        ` · ${deck.owner.city}, ${deck.owner.province}`}
                    </div>
                    <div className="text-sm font-bold text-emerald-400">
                      {formatPrice(deck.estimated_value_cents)}
                    </div>
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
