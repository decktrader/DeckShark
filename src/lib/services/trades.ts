import { createClient } from '@/lib/supabase/client'
import type { Trade, TradeDeck, ServiceResponse } from '@/types'

// ─── Propose ────────────────────────────────────────────────────────────────

export async function proposeTrade(
  proposerId: string,
  receiverId: string,
  proposerDeckIds: string[],
  receiverDeckIds: string[],
  cashDifferenceCents: number = 0,
  message?: string,
): Promise<ServiceResponse<Trade>> {
  const supabase = createClient()

  const { data: trade, error } = await supabase
    .from('trades')
    .insert({
      proposer_id: proposerId,
      receiver_id: receiverId,
      cash_difference_cents: cashDifferenceCents,
      message: message ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Insert decks for both sides
  const deckRows = [
    ...proposerDeckIds.map((deck_id) => ({
      trade_id: trade.id,
      deck_id,
      offered_by: proposerId,
    })),
    ...receiverDeckIds.map((deck_id) => ({
      trade_id: trade.id,
      deck_id,
      offered_by: receiverId,
    })),
  ]

  const { error: decksError } = await supabase
    .from('trade_decks')
    .insert(deckRows)

  if (decksError) return { data: null, error: decksError.message }

  return { data: trade as Trade, error: null }
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getTrade(id: string): Promise<ServiceResponse<Trade>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Trade, error: null }
}

export async function getUserTrades(
  userId: string,
): Promise<ServiceResponse<Trade[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .or(`proposer_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as Trade[], error: null }
}

export async function getTradeDecks(
  tradeId: string,
): Promise<ServiceResponse<TradeDeck[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trade_decks')
    .select('*')
    .eq('trade_id', tradeId)

  if (error) return { data: null, error: error.message }
  return { data: data as TradeDeck[], error: null }
}

// ─── Status transitions ──────────────────────────────────────────────────────

export async function updateTradeStatus(
  tradeId: string,
  status: Trade['status'],
): Promise<ServiceResponse<Trade>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trades')
    .update({ status })
    .eq('id', tradeId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Trade, error: null }
}

export async function acceptTrade(
  tradeId: string,
): Promise<ServiceResponse<Trade>> {
  return updateTradeStatus(tradeId, 'accepted')
}

export async function declineTrade(
  tradeId: string,
): Promise<ServiceResponse<Trade>> {
  return updateTradeStatus(tradeId, 'declined')
}

export async function cancelTrade(
  tradeId: string,
): Promise<ServiceResponse<Trade>> {
  return updateTradeStatus(tradeId, 'cancelled')
}

export async function completeTrade(
  tradeId: string,
): Promise<ServiceResponse<Trade>> {
  return updateTradeStatus(tradeId, 'completed')
}

// ─── Contact sharing (PIPEDA consent) ───────────────────────────────────────

export async function shareContact(
  tradeId: string,
  role: 'proposer' | 'receiver',
): Promise<ServiceResponse<Trade>> {
  const supabase = createClient()
  const field =
    role === 'proposer' ? 'proposer_contact_shared' : 'receiver_contact_shared'

  const { data, error } = await supabase
    .from('trades')
    .update({ [field]: true })
    .eq('id', tradeId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Trade, error: null }
}
