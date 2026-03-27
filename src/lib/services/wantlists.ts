import { createClient } from '@/lib/supabase/client'
import type { WantList, ServiceResponse } from '@/types'

export async function createWantList(
  userId: string,
  input: {
    title: string
    format?: string
    archetype?: string
    commander_name?: string
    min_value_cents?: number
    max_value_cents?: number
    description?: string
  },
): Promise<ServiceResponse<WantList>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('want_lists')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as WantList, error: null }
}

export async function updateWantList(
  id: string,
  input: Partial<{
    title: string
    format: string | null
    archetype: string | null
    commander_name: string | null
    min_value_cents: number | null
    max_value_cents: number | null
    description: string | null
    status: WantList['status']
  }>,
): Promise<ServiceResponse<WantList>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('want_lists')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as WantList, error: null }
}

export async function deleteWantList(
  id: string,
): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase.from('want_lists').delete().eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
