import { createClient } from '@/lib/supabase/client'
import type { ServiceResponse } from '@/types'

/** Dismiss a trade match (client-side) */
export async function dismissTradeMatch(
  matchId: string,
): Promise<ServiceResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('trade_matches')
    .update({ status: 'dismissed' })
    .eq('id', matchId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
