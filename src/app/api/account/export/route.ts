import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [profile, decks, trades, wantLists, reviews] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('decks').select('*, deck_cards(*)').eq('user_id', user.id),
    supabase
      .from('trades')
      .select('*, trade_decks(*)')
      .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`),
    supabase.from('want_lists').select('*').eq('user_id', user.id),
    supabase
      .from('reviews')
      .select('*')
      .or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    decks: decks.data ?? [],
    trades: trades.data ?? [],
    want_lists: wantLists.data ?? [],
    reviews: reviews.data ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="decktrader-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
