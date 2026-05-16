import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getIp, notifyLimiter } from '@/lib/rate-limit'
import { findAndStoreMatches } from '@/lib/services/trade-matches.server'

export async function POST(request: Request) {
  const { success } = await checkRateLimit(notifyLimiter, getIp(request))
  if (!success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { deckId } = (await request.json()) as { deckId: string }
  if (!deckId) {
    return NextResponse.json({ error: 'Missing deckId' }, { status: 400 })
  }

  // Verify ownership
  const { data: deck } = await supabase
    .from('decks')
    .select('user_id')
    .eq('id', deckId)
    .single()

  if (!deck || deck.user_id !== authUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await findAndStoreMatches(deckId)
  return NextResponse.json({ ok: true, ...result })
}
