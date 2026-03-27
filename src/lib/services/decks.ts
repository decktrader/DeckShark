import { createClient } from '@/lib/supabase/client'
import type { Deck, DeckCard, DeckPhoto, ServiceResponse } from '@/types'

export async function createDeck(
  userId: string,
  deck: {
    name: string
    format: string
    description?: string
    commander_name?: string
    commander_scryfall_id?: string
    condition_notes?: string
  },
): Promise<ServiceResponse<Deck>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('decks')
    .insert({ ...deck, user_id: userId })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Deck, error: null }
}

export async function getDeck(id: string): Promise<ServiceResponse<Deck>> {
  const supabase = createClient()
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
  const supabase = createClient()
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as Deck[], error: null }
}

export async function updateDeck(
  id: string,
  updates: Partial<
    Pick<
      Deck,
      | 'name'
      | 'format'
      | 'description'
      | 'commander_name'
      | 'commander_scryfall_id'
      | 'condition_notes'
      | 'status'
      | 'available_for_trade'
      | 'estimated_value_cents'
    >
  >,
): Promise<ServiceResponse<Deck>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('decks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Deck, error: null }
}

export async function deleteDeck(id: string): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('decks').delete().eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// Deck cards

export async function addDeckCards(
  deckId: string,
  cards: {
    card_name: string
    scryfall_id?: string
    quantity: number
    is_commander: boolean
    price_cents?: number
  }[],
): Promise<ServiceResponse<DeckCard[]>> {
  const supabase = createClient()
  const rows = cards.map((card) => ({
    deck_id: deckId,
    card_name: card.card_name,
    scryfall_id: card.scryfall_id ?? null,
    quantity: card.quantity,
    is_commander: card.is_commander,
    price_cents: card.price_cents ?? null,
  }))

  const { data, error } = await supabase
    .from('deck_cards')
    .insert(rows)
    .select()

  if (error) return { data: null, error: error.message }
  return { data: data as DeckCard[], error: null }
}

export async function getDeckCards(
  deckId: string,
): Promise<ServiceResponse<DeckCard[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deck_cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('is_commander', { ascending: false })
    .order('card_name')

  if (error) return { data: null, error: error.message }
  return { data: data as DeckCard[], error: null }
}

export async function updateDeckCard(
  id: string,
  updates: Partial<Pick<DeckCard, 'quantity' | 'is_commander'>>,
): Promise<ServiceResponse<DeckCard>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deck_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as DeckCard, error: null }
}

export async function deleteDeckCard(
  id: string,
): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('deck_cards').delete().eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function clearDeckCards(
  deckId: string,
): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('deck_cards')
    .delete()
    .eq('deck_id', deckId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// Deck photos

export async function addDeckPhoto(
  deckId: string,
  storagePath: string,
  isPrimary = false,
): Promise<ServiceResponse<DeckPhoto>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deck_photos')
    .insert({
      deck_id: deckId,
      storage_path: storagePath,
      is_primary: isPrimary,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as DeckPhoto, error: null }
}

export async function getDeckPhotos(
  deckId: string,
): Promise<ServiceResponse<DeckPhoto[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('deck_photos')
    .select('*')
    .eq('deck_id', deckId)
    .order('is_primary', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as DeckPhoto[], error: null }
}

export async function deleteDeckPhoto(
  id: string,
): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('deck_photos').delete().eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// Calculate deck value from card prices
export async function calculateDeckValue(
  deckId: string,
): Promise<ServiceResponse<number>> {
  const { data: cards, error } = await getDeckCards(deckId)
  if (error || !cards) return { data: null, error }

  const totalCents = cards.reduce((sum, card) => {
    return sum + (card.price_cents ?? 0) * card.quantity
  }, 0)

  // Update the deck's estimated value
  await updateDeck(deckId, { estimated_value_cents: totalCents })

  return { data: totalCents, error: null }
}
