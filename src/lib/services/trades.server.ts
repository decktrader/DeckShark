import { createClient } from '@/lib/supabase/server'
import type { Trade, TradeDeck, ServiceResponse, Deck, User } from '@/types'

export interface TradeWithDecks extends Trade {
  proposer: Pick<User, 'id' | 'username' | 'city' | 'province'>
  receiver: Pick<User, 'id' | 'username' | 'city' | 'province'>
  trade_decks: (TradeDeck & { deck: Deck })[]
}

export async function getTrade(
  id: string,
): Promise<ServiceResponse<TradeWithDecks>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trades')
    .select(
      `*,
      proposer:users!proposer_id(id, username, city, province),
      receiver:users!receiver_id(id, username, city, province),
      trade_decks(*, deck:decks(*))`,
    )
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as TradeWithDecks, error: null }
}

export async function getUserTrades(
  userId: string,
): Promise<ServiceResponse<TradeWithDecks[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trades')
    .select(
      `*,
      proposer:users!proposer_id(id, username, city, province),
      receiver:users!receiver_id(id, username, city, province),
      trade_decks(*, deck:decks(*))`,
    )
    .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as TradeWithDecks[], error: null }
}
