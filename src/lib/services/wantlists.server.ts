import { createClient } from '@/lib/supabase/server'
import type { WantList, ServiceResponse } from '@/types'
import type { PublicDeck } from '@/lib/services/decks.server'

export interface WantListWithOwner extends WantList {
  owner: {
    id: string
    username: string
    city: string | null
    province: string | null
    avatar_url: string | null
  }
}

export async function getUserWantLists(
  userId: string,
): Promise<ServiceResponse<WantList[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('want_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as WantList[], error: null }
}

export async function getWantList(
  id: string,
): Promise<ServiceResponse<WantListWithOwner>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('want_lists')
    .select('*, owner:users!user_id(id, username, city, province, avatar_url)')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as WantListWithOwner, error: null }
}

export async function getPublicWantLists(): Promise<
  ServiceResponse<WantListWithOwner[]>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('want_lists')
    .select('*, owner:users!user_id(id, username, city, province, avatar_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as WantListWithOwner[], error: null }
}

// Return available decks that match a given want list
export async function getMatchingDecks(
  wantList: WantList,
): Promise<ServiceResponse<PublicDeck[]>> {
  const supabase = await createClient()

  let query = supabase
    .from('decks')
    .select('*, owner:users!user_id(id, username, city, province, avatar_url)')
    .eq('available_for_trade', true)
    .eq('status', 'active')
    // Don't match the want list owner's own decks
    .neq('user_id', wantList.user_id)

  if (wantList.format) {
    query = query.eq('format', wantList.format)
  }
  if (wantList.archetype) {
    query = query.eq('archetype', wantList.archetype)
  }
  if (wantList.commander_name) {
    query = query.ilike('commander_name', `%${wantList.commander_name}%`)
  }
  if (wantList.min_value_cents) {
    query = query.gte('estimated_value_cents', wantList.min_value_cents)
  }
  if (wantList.max_value_cents) {
    query = query.lte('estimated_value_cents', wantList.max_value_cents)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as PublicDeck[], error: null }
}
