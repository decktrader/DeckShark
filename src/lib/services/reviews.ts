import { createClient } from '@/lib/supabase/client'
import type { Review, ServiceResponse } from '@/types'

export async function createReview(
  tradeId: string,
  reviewerId: string,
  revieweeId: string,
  rating: number,
  comment?: string,
): Promise<ServiceResponse<Review>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      trade_id: tradeId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comment: comment ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Review, error: null }
}
