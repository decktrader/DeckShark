import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp, authLimiter } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const { success } = await checkRateLimit(authLimiter, getIp(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all user data in parallel
  const [
    profileRes,
    decksRes,
    deckCardsRes,
    tradesRes,
    reviewsGivenRes,
    reviewsReceivedRes,
    wantListsRes,
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('decks').select('*').eq('user_id', user.id),
    supabase
      .from('deck_cards')
      .select('*, deck:decks!inner(user_id)')
      .eq('deck.user_id', user.id),
    supabase
      .from('trades')
      .select('*')
      .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase.from('reviews').select('*').eq('reviewer_id', user.id),
    supabase.from('reviews').select('*').eq('reviewee_id', user.id),
    supabase.from('want_lists').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileRes.data,
    decks: decksRes.data ?? [],
    deck_cards: (deckCardsRes.data ?? []).map(({ deck, ...card }) => card),
    trades: tradesRes.data ?? [],
    reviews_given: reviewsGivenRes.data ?? [],
    reviews_received: reviewsReceivedRes.data ?? [],
    want_lists: wantListsRes.data ?? [],
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="deckshark-export-${user.id.slice(0, 8)}.json"`,
    },
  })
}
