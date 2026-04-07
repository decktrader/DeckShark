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

export async function getPublicDecks(
  filters: PublicDeckFilters = {},
): Promise<ServiceResponse<PublicDeck[]>> {
  const supabase = await createClient()

  // Build sort — power level is client-side (custom order), others are DB-level
  const sortBy = filters.sortBy ?? 'recent'
  let query = supabase
    .from('decks')
    .select(
      '*, owner:users!user_id(id, username, city, province, avatar_url, trade_rating, completed_trades)',
    )
    .eq('available_for_trade', true)
    .eq('status', 'active')
    .limit(filters.limit ?? 1000)

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
    query = query.ilike('commander_name', `%${filters.commander}%`)
  }
  if (filters.q) {
    query = query.or(
      `name.ilike.%${filters.q}%,commander_name.ilike.%${filters.q}%`,
    )
  }
  if (filters.powerLevel) {
    query = query.eq('power_level', filters.powerLevel)
  }
  if (filters.colorIdentity && filters.colorIdentity.length > 0) {
    // Deck's color_identity must contain all selected colors
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

  const { data, error } = await query

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
    decks = decks.sort(
      (a, b) =>
        (POWER_LEVEL_ORDER[a.power_level ?? ''] ?? 0) -
        (POWER_LEVEL_ORDER[b.power_level ?? ''] ?? 0),
    )
  } else if (sortBy === 'power_desc') {
    decks = decks.sort(
      (a, b) =>
        (POWER_LEVEL_ORDER[b.power_level ?? ''] ?? 0) -
        (POWER_LEVEL_ORDER[a.power_level ?? ''] ?? 0),
    )
  }

  return { data: decks, error: null }
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
