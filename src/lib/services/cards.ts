import { createClient } from '@/lib/supabase/client'
import type { CardCache, ServiceResponse } from '@/types'

export async function searchCards(
  query: string,
  limit = 20,
): Promise<ServiceResponse<CardCache[]>> {
  if (query.length < 2) return { data: [], error: null }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('card_cache')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data: data as CardCache[], error: null }
}

export async function getCardByName(
  name: string,
): Promise<ServiceResponse<CardCache>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('card_cache')
    .select('*')
    .eq('name', name)
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as CardCache | null, error: null }
}

export async function getCardsByIds(
  scryfallIds: string[],
): Promise<ServiceResponse<CardCache[]>> {
  if (scryfallIds.length === 0) return { data: [], error: null }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('card_cache')
    .select('*')
    .in('scryfall_id', scryfallIds)

  if (error) return { data: null, error: error.message }
  return { data: data as CardCache[], error: null }
}

export async function getCardPrice(
  scryfallId: string,
): Promise<
  ServiceResponse<{ usd_cents: number | null; usd_foil_cents: number | null }>
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('card_cache')
    .select('price_usd_cents, price_usd_foil_cents')
    .eq('scryfall_id', scryfallId)
    .single()

  if (error) return { data: null, error: error.message }
  return {
    data: {
      usd_cents: data.price_usd_cents,
      usd_foil_cents: data.price_usd_foil_cents,
    },
    error: null,
  }
}
