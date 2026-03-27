import { createClient } from '@/lib/supabase/server'
import type { Review, ServiceResponse } from '@/types'

export interface ReviewWithReviewer extends Review {
  reviewer: { username: string }
}

export async function getReviewsForUser(
  userId: string,
): Promise<ServiceResponse<ReviewWithReviewer[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:users!reviewer_id(username)')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as ReviewWithReviewer[], error: null }
}

export async function getTradeReview(
  tradeId: string,
  reviewerId: string,
): Promise<ServiceResponse<Review | null>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('trade_id', tradeId)
    .eq('reviewer_id', reviewerId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as Review | null, error: null }
}
