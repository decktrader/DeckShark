import { createClient } from '@/lib/supabase/server'
import type { Deck, DeckCard, DeckPhoto, ServiceResponse, User } from '@/types'

export interface PublicDeckFilters {
  userId?: string
  minValueCents?: number
  maxValueCents?: number
  city?: string
  province?: string
  format?: string
  commander?: string
}

export interface PublicDeck extends Deck {
  owner: Pick<User, 'id' | 'username' | 'city' | 'province' | 'avatar_url'>
}

export async function getPublicDecks(
  filters: PublicDeckFilters = {},
): Promise<ServiceResponse<PublicDeck[]>> {
  const supabase = await createClient()

  let query = supabase
    .from('decks')
    .select('*, owner:users!user_id(id, username, city, province, avatar_url)')
    .eq('available_for_trade', true)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters.format) {
    query = query.eq('format', filters.format)
  }
  if (filters.commander) {
    query = query.ilike('commander_name', `%${filters.commander}%`)
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

  return { data: decks, error: null }
}

export async function getPublicDeck(
  id: string,
): Promise<ServiceResponse<PublicDeck>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decks')
    .select('*, owner:users!user_id(id, username, city, province, avatar_url)')
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
