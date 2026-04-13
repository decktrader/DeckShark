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
  | 'declined'
  | 'countered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
export type WantListStatus = 'active' | 'fulfilled'

export interface NotificationPreferences {
  trade_updates: boolean
  want_list_matches: boolean
}

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
  notification_preferences: NotificationPreferences
  email_updates_opt_in: boolean
  last_nudge_sent_at: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Deck {
  id: string
  user_id: string
  name: string
  commander_name: string | null
  commander_scryfall_id: string | null
  partner_commander_name: string | null
  partner_commander_scryfall_id: string | null
  format: string
  archetype: string | null
  description: string | null
  estimated_value_cents: number | null
  condition_notes: string | null
  status: DeckStatus
  available_for_trade: boolean
  includes_sleeves: boolean
  includes_deckbox: boolean
  power_level: string | null
  color_identity: string[]
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
  message: string | null
  receiver_message: string | null
  proposer_contact_shared: boolean
  receiver_contact_shared: boolean
  last_counter_by: string | null
  created_at: string
  updated_at: string
}

export interface TradeDeck {
  id: string
  trade_id: string
  deck_id: string
  offered_by: string
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
  set_name: string | null
  collector_number: string | null
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
  format: string | null
  archetype: string | null
  commander_name: string | null
  color_identity: string[] | null
  power_level: string | null
  min_value_cents: number | null
  max_value_cents: number | null
  description: string | null
  status: WantListStatus
  created_at: string
  updated_at: string
}

export type ReportTargetType = 'user' | 'deck' | 'trade'
export type ReportStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed'
export type FeedbackCategory = 'bug' | 'feature' | 'general'
export type FeedbackStatus = 'new' | 'reviewed' | 'archived'

export interface Report {
  id: string
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: string
  description: string | null
  status: ReportStatus
  admin_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}

export interface Feedback {
  id: string
  user_id: string | null
  category: FeedbackCategory
  message: string
  page_url: string | null
  page_route: string | null
  user_agent: string | null
  status: FeedbackStatus
  admin_notes: string | null
  created_at: string
}

export interface UserSuspension {
  id: string
  user_id: string
  reason: string
  suspended_by: string
  suspended_at: string
  expires_at: string | null
  lifted_at: string | null
  lifted_by: string | null
}

export interface AdminStats {
  total_users: number
  total_decks: number
  active_trades: number
  completed_trades: number
  total_want_lists: number
  total_trade_value_cents: number
  open_reports: number
  new_feedback: number
}

// Service response wrapper
export interface ServiceResponse<T> {
  data: T | null
  error: string | null
}
