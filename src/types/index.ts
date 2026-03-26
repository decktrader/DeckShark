// Shared TypeScript types matching DB schema
// DB-generated types live in src/types/database.ts (via `supabase gen types typescript`)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export type DeckStatus = 'active' | 'in_trade' | 'traded' | 'unlisted'
export type TradeStatus =
  | 'proposed'
  | 'accepted'
  | 'meetup_scheduled'
  | 'completed'
  | 'cancelled'
  | 'disputed'
export type WantListStatus = 'active' | 'fulfilled'

export interface User {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  city: string | null
  province: string | null
  reputation_score: number
  completed_trades: number
  trade_rating: number
  created_at: string
  updated_at: string
}

export interface Deck {
  id: string
  user_id: string
  name: string
  commander_name: string | null
  commander_scryfall_id: string | null
  format: string
  description: string | null
  estimated_value_cents: number | null
  condition_notes: string | null
  status: DeckStatus
  available_for_trade: boolean
  created_at: string
  updated_at: string
}

export interface DeckCard {
  id: string
  deck_id: string
  card_name: string
  scryfall_id: string | null
  quantity: number
  is_commander: boolean
  price_cents: number | null
}

export interface DeckPhoto {
  id: string
  deck_id: string
  storage_path: string
  is_primary: boolean
  created_at: string
}

export interface Trade {
  id: string
  proposer_id: string
  receiver_id: string
  status: TradeStatus
  cash_difference_cents: number
  cash_payer_id: string | null
  meetup_date: string | null
  message: string | null
  created_at: string
  updated_at: string
}

export interface TradeDeck {
  id: string
  trade_id: string
  deck_id: string
  offered_by: string
  created_at: string
}

export interface Review {
  id: string
  trade_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface CardCache {
  scryfall_id: string
  oracle_id: string | null
  name: string
  mana_cost: string | null
  type_line: string | null
  color_identity: string[]
  set_code: string | null
  image_uri_normal: string | null
  image_uri_small: string | null
  image_uri_art_crop: string | null
  price_usd_cents: number | null
  price_usd_foil_cents: number | null
  legalities: Json | null
  updated_at: string
  created_at: string
}

export interface WantList {
  id: string
  user_id: string
  title: string
  commander_name: string | null
  color_identity: string[] | null
  min_value_cents: number | null
  max_value_cents: number | null
  description: string | null
  status: WantListStatus
  created_at: string
  updated_at: string
}

// Service response wrapper
export interface ServiceResponse<T> {
  data: T | null
  error: string | null
}
