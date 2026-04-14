import { createClient } from '@/lib/supabase/client'
import type { ServiceResponse } from '@/types'

export async function addInterest(
  userId: string,
  deckId: string,
): Promise<ServiceResponse<{ id: string }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('deck_interests')
    .insert({ user_id: userId, deck_id: deckId })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function removeInterest(
  userId: string,
  deckId: string,
): Promise<ServiceResponse<null>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('deck_interests')
    .delete()
    .eq('user_id', userId)
    .eq('deck_id', deckId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
