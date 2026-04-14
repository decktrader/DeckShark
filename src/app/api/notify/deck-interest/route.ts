import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendInterestThresholdEmail } from '@/lib/services/email'
import { checkRateLimit, getIp, notifyLimiter } from '@/lib/rate-limit'

const THRESHOLDS = [1, 5, 10, 25]

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: Request) {
  // Rate limit
  const { success } = await checkRateLimit(notifyLimiter, getIp(req))
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

  const { deckId } = await req.json()
  if (!deckId) {
    return NextResponse.json({ error: 'Missing deckId' }, { status: 400 })
  }

  // Get current interest count for this deck
  const { count, error: countError } = await supabase
    .from('deck_interests')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId)

  if (countError || count === null) {
    return NextResponse.json({ ok: true })
  }

  // Check if this count crosses a threshold we haven't notified yet
  const { data: deck } = await supabase
    .from('decks')
    .select('id, name, user_id, interest_thresholds_notified')
    .eq('id', deckId)
    .single()

  if (!deck) return NextResponse.json({ ok: true })

  // Don't notify the owner about their own deck interest
  if (deck.user_id === user.id) return NextResponse.json({ ok: true })

  const notified: number[] = deck.interest_thresholds_notified ?? []
  const crossedThreshold = THRESHOLDS.find(
    (t) => count >= t && !notified.includes(t),
  )

  if (!crossedThreshold) return NextResponse.json({ ok: true })

  // Get owner email via admin client (email not exposed via RLS)
  const admin = adminClient()
  const { data: authData } = await admin.auth.admin.getUserById(deck.user_id)
  const ownerEmail = authData?.user?.email
  if (!ownerEmail) return NextResponse.json({ ok: true })

  // Get owner username
  const { data: owner } = await supabase
    .from('users')
    .select('username, email_updates_opt_in')
    .eq('id', deck.user_id)
    .single()

  if (!owner || owner.email_updates_opt_in === false) {
    return NextResponse.json({ ok: true })
  }

  // Send the email
  await sendInterestThresholdEmail({
    to: ownerEmail,
    userId: deck.user_id,
    username: owner.username,
    deckName: deck.name,
    deckId: deck.id,
    interestCount: count,
  })

  // Mark threshold as notified
  const updatedThresholds = [...notified, crossedThreshold]
  await supabase
    .from('decks')
    .update({ interest_thresholds_notified: updatedThresholds })
    .eq('id', deckId)

  return NextResponse.json({ ok: true })
}
