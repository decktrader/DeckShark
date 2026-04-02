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

/**
 * Resolve a card to a specific printing using a waterfall:
 * 1. set_code + collector_number → exact printing
 * 2. name + set_code → cheapest in that set
 * 3. name only → cheapest printing overall
 */
export async function resolveCardPrinting(
  name: string,
  setCode?: string,
  collectorNumber?: string,
): Promise<ServiceResponse<CardCache>> {
  const supabase = createClient()

  // 1. Exact printing match: set + collector number
  if (setCode && collectorNumber) {
    const { data, error } = await supabase
      .from('card_cache')
      .select('*')
      .ilike('set_code', setCode)
      .eq('collector_number', collectorNumber)
      .limit(1)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    if (data) return { data: data as CardCache, error: null }
  }

  // 2. Name + set code: pick cheapest in that set
  if (setCode) {
    const { data, error } = await supabase
      .from('card_cache')
      .select('*')
      .ilike('name', name)
      .ilike('set_code', setCode)
      .not('price_usd_cents', 'is', null)
      .order('price_usd_cents', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    if (data) return { data: data as CardCache, error: null }
  }

  // 3. Name only: cheapest printing with a price
  const { data, error } = await supabase
    .from('card_cache')
    .select('*')
    .ilike('name', name)
    .not('price_usd_cents', 'is', null)
    .order('price_usd_cents', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }

  // Final fallback: any printing (even without price)
  if (!data) {
    const { data: fallback, error: fbError } = await supabase
      .from('card_cache')
      .select('*')
      .ilike('name', name)
      .limit(1)
      .maybeSingle()

    if (fbError) return { data: null, error: fbError.message }
    return { data: fallback as CardCache | null, error: null }
  }

  return { data: data as CardCache, error: null }
}

/** Get all printings of a card by oracle_id, sorted by set name */
export async function getCardPrintings(
  oracleId: string,
): Promise<ServiceResponse<CardCache[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('card_cache')
    .select('*')
    .eq('oracle_id', oracleId)
    .order('set_name', { ascending: true })
    .order('collector_number', { ascending: true })

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
