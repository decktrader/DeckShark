import { createClient } from '@/lib/supabase/server'
import type { ServiceResponse } from '@/types'

/** Get interest count for a single deck */
export async function getInterestCount(
  deckId: string,
): Promise<ServiceResponse<number>> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('deck_interests')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId)

  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}

/** Check if a specific user has expressed interest in a deck */
export async function hasUserInterest(
  userId: string,
  deckId: string,
): Promise<ServiceResponse<boolean>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deck_interests')
    .select('id')
    .eq('user_id', userId)
    .eq('deck_id', deckId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: !!data, error: null }
}

/** Get interest counts for multiple decks (batch for browse/dashboard) */
export async function getInterestCountsForDecks(
  deckIds: string[],
): Promise<ServiceResponse<Record<string, number>>> {
  if (deckIds.length === 0) return { data: {}, error: null }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deck_interests')
    .select('deck_id')
    .in('deck_id', deckIds)

  if (error) return { data: null, error: error.message }

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.deck_id] = (counts[row.deck_id] ?? 0) + 1
  }
  return { data: counts, error: null }
}

/** Get total interest across all of a user's decks (for dashboard) */
export async function getTotalInterestForUser(
  userId: string,
): Promise<ServiceResponse<number>> {
  const supabase = await createClient()

  const { data: decks, error: decksError } = await supabase
    .from('decks')
    .select('id')
    .eq('user_id', userId)

  if (decksError) return { data: null, error: decksError.message }
  if (!decks || decks.length === 0) return { data: 0, error: null }

  const deckIds = decks.map((d) => d.id)

  const { count, error } = await supabase
    .from('deck_interests')
    .select('*', { count: 'exact', head: true })
    .in('deck_id', deckIds)

  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}

/** Get decks a user has expressed interest in (for dashboard) */
export async function getUserInterestedDecks(userId: string): Promise<
  ServiceResponse<
    {
      deck_id: string
      name: string
      commander_name: string | null
      commander_scryfall_id: string | null
      partner_commander_scryfall_id: string | null
      format: string
      estimated_value_cents: number | null
      owner_username: string
      owner_city: string | null
    }[]
  >
> {
  const supabase = await createClient()

  const { data: interests, error } = await supabase
    .from('deck_interests')
    .select('deck_id')
    .eq('user_id', userId)

  if (error) return { data: null, error: error.message }
  if (!interests || interests.length === 0) return { data: [], error: null }

  const deckIds = interests.map((i) => i.deck_id)

  const { data: decks, error: decksError } = await supabase
    .from('decks')
    .select(
      'id, name, commander_name, commander_scryfall_id, partner_commander_scryfall_id, format, estimated_value_cents, owner:users!user_id(username, city)',
    )
    .in('id', deckIds)
    .eq('available_for_trade', true)

  if (decksError) return { data: null, error: decksError.message }

  const rows = (decks ?? []).map((d) => {
    const owner = d.owner as unknown as {
      username: string
      city: string | null
    }
    return {
      deck_id: d.id,
      name: d.name,
      commander_name: d.commander_name,
      commander_scryfall_id: d.commander_scryfall_id,
      partner_commander_scryfall_id: d.partner_commander_scryfall_id,
      format: d.format,
      estimated_value_cents: d.estimated_value_cents,
      owner_username: owner?.username ?? 'Unknown',
      owner_city: owner?.city ?? null,
    }
  })

  return { data: rows, error: null }
}

/** Get interest by city pair for admin analytics (origin city → deck city) */
export async function getInterestByCityPair(): Promise<
  ServiceResponse<{ from_city: string; to_city: string; count: number }[]>
> {
  const supabase = await createClient()

  // Fetch all interests with user_id and deck_id
  const { data: interests, error } = await supabase
    .from('deck_interests')
    .select('user_id, deck_id')

  if (error) return { data: null, error: error.message }
  if (!interests || interests.length === 0) return { data: [], error: null }

  // Collect all unique user IDs (interested users + deck owners)
  const interestedUserIds = [...new Set(interests.map((i) => i.user_id))]
  const deckIds = [...new Set(interests.map((i) => i.deck_id))]

  // Fetch deck → owner mapping
  const { data: decks } = await supabase
    .from('decks')
    .select('id, user_id')
    .in('id', deckIds)

  const deckOwnerMap: Record<string, string> = {}
  for (const d of decks ?? []) {
    deckOwnerMap[d.id] = d.user_id
  }

  // Fetch cities for all relevant users
  const allUserIds = [
    ...new Set([...interestedUserIds, ...Object.values(deckOwnerMap)]),
  ]
  const { data: users } = await supabase
    .from('users')
    .select('id, city')
    .in('id', allUserIds)

  const userCityMap: Record<string, string> = {}
  for (const u of users ?? []) {
    if (u.city) userCityMap[u.id] = u.city
  }

  // Aggregate by city pair
  const pairCounts: Record<string, number> = {}
  for (const interest of interests) {
    const fromCity = userCityMap[interest.user_id]
    const ownerId = deckOwnerMap[interest.deck_id]
    const toCity = ownerId ? userCityMap[ownerId] : undefined
    if (fromCity && toCity && fromCity !== toCity) {
      const key = `${fromCity}→${toCity}`
      pairCounts[key] = (pairCounts[key] ?? 0) + 1
    }
  }

  const rows = Object.entries(pairCounts)
    .map(([pair, count]) => {
      const [from_city, to_city] = pair.split('→')
      return { from_city, to_city, count }
    })
    .sort((a, b) => b.count - a.count)

  return { data: rows, error: null }
}
