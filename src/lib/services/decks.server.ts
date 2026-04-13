import { createClient } from '@/lib/supabase/server'
import type { Deck, DeckCard, DeckPhoto, ServiceResponse, User } from '@/types'

export type SortOption =
  | 'recent'
  | 'value_asc'
  | 'value_desc'
  | 'power_asc'
  | 'power_desc'

const POWER_LEVEL_ORDER: Record<string, number> = {
  bracket1: 1,
  bracket2: 2,
  bracket3: 3,
  bracket4: 4,
  bracket5: 5,
}

export interface PublicDeckFilters {
  userId?: string
  minValueCents?: number
  maxValueCents?: number
  city?: string
  province?: string
  format?: string
  commander?: string
  q?: string
  powerLevel?: string
  colorIdentity?: string[]
  archetype?: string
  sortBy?: SortOption
  limit?: number
  page?: number
  pageSize?: number
}

export interface PublicDeck extends Deck {
  owner: Pick<
    User,
    | 'id'
    | 'username'
    | 'city'
    | 'province'
    | 'avatar_url'
    | 'trade_rating'
    | 'completed_trades'
  >
}

export interface PublicDeckResult {
  decks: PublicDeck[]
  total: number
}

export async function getPublicDecks(
  filters: PublicDeckFilters = {},
): Promise<ServiceResponse<PublicDeckResult>> {
  const supabase = await createClient()

  const sortBy = filters.sortBy ?? 'recent'
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? filters.limit ?? 1000

  // When city/province filters or power-level sort are active we must fetch all
  // rows because those operations happen client-side. Otherwise use DB pagination.
  const needsClientFilter = !!(filters.city || filters.province)
  const needsClientSort = sortBy === 'power_asc' || sortBy === 'power_desc'
  const canDbPaginate = !needsClientFilter && !needsClientSort

  let query = supabase
    .from('decks')
    .select(
      '*, owner:users!user_id(id, username, city, province, avatar_url, trade_rating, completed_trades)',
      { count: 'exact' },
    )
    .eq('available_for_trade', true)
    .eq('status', 'active')

  if (sortBy === 'value_asc') {
    query = query.order('estimated_value_cents', {
      ascending: true,
      nullsFirst: false,
    })
  } else if (sortBy === 'value_desc') {
    query = query.order('estimated_value_cents', {
      ascending: false,
      nullsFirst: false,
    })
  } else {
    query = query.order('updated_at', { ascending: false })
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters.format) {
    query = query.eq('format', filters.format)
  }
  if (filters.commander) {
    query = query.or(
      `commander_name.ilike.%${filters.commander}%,partner_commander_name.ilike.%${filters.commander}%`,
    )
  }
  if (filters.q) {
    query = query.or(
      `name.ilike.%${filters.q}%,commander_name.ilike.%${filters.q}%,partner_commander_name.ilike.%${filters.q}%`,
    )
  }
  if (filters.powerLevel) {
    query = query.eq('power_level', filters.powerLevel)
  }
  if (filters.colorIdentity && filters.colorIdentity.length > 0) {
    query = query.contains('color_identity', filters.colorIdentity)
  }
  if (filters.archetype) {
    query = query.eq('archetype', filters.archetype)
  }
  if (filters.minValueCents !== undefined) {
    query = query.gte('estimated_value_cents', filters.minValueCents)
  }
  if (filters.maxValueCents !== undefined) {
    query = query.lte('estimated_value_cents', filters.maxValueCents)
  }

  // Apply DB-level pagination when possible
  if (canDbPaginate) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) return { data: null, error: error.message }

  let decks = data as PublicDeck[]

  // Filter by city/province on the joined owner (PostgREST doesn't support
  // filtering on embedded relationships directly in this pattern)
  if (filters.city) {
    const city = filters.city.toLowerCase()
    decks = decks.filter((d) => d.owner?.city?.toLowerCase().includes(city))
  }
  if (filters.province) {
    decks = decks.filter((d) => d.owner?.province === filters.province)
  }

  // Client-side power level sort (custom ordering, not alphabetical)
  if (sortBy === 'power_asc') {
    decks.sort(
      (a, b) =>
        (POWER_LEVEL_ORDER[a.power_level ?? ''] ?? 0) -
        (POWER_LEVEL_ORDER[b.power_level ?? ''] ?? 0),
    )
  } else if (sortBy === 'power_desc') {
    decks.sort(
      (a, b) =>
        (POWER_LEVEL_ORDER[b.power_level ?? ''] ?? 0) -
        (POWER_LEVEL_ORDER[a.power_level ?? ''] ?? 0),
    )
  }

  // Client-side pagination when DB pagination wasn't possible
  let total = count ?? decks.length
  if (!canDbPaginate) {
    total = decks.length
    const from = (page - 1) * pageSize
    decks = decks.slice(from, from + pageSize)
  }

  return { data: { decks, total }, error: null }
}

export async function getPublicDeck(
  id: string,
): Promise<ServiceResponse<PublicDeck>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decks')
    .select(
      '*, owner:users!user_id(id, username, city, province, avatar_url, trade_rating, completed_trades)',
    )
    .eq('id', id)
    .eq('available_for_trade', true)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as PublicDeck, error: null }
}

export async function getDeck(id: string): Promise<ServiceResponse<Deck>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Deck, error: null }
}

export async function getUserDecks(
  userId: string,
): Promise<ServiceResponse<Deck[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as Deck[], error: null }
}

export async function getDeckCards(
  deckId: string,
): Promise<ServiceResponse<DeckCard[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deck_cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('is_commander', { ascending: false })
    .order('card_name')

  if (error) return { data: null, error: error.message }
  return { data: data as DeckCard[], error: null }
}

export async function getDeckPhotos(
  deckId: string,
): Promise<ServiceResponse<DeckPhoto[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('deck_photos')
    .select('*')
    .eq('deck_id', deckId)
    .order('is_primary', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as DeckPhoto[], error: null }
}
