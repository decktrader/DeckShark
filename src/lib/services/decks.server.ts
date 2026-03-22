import { createClient } from '@/lib/supabase/server'
import type { Deck, DeckCard, DeckPhoto, ServiceResponse } from '@/types'

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
