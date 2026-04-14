import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/services/notifications.server'
import { checkRateLimit, getIp, notifyLimiter } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const { success } = await checkRateLimit(notifyLimiter, getIp(req))
  if (!success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { revieweeId, rating, tradeId } = await req.json()
  if (!revieweeId || !rating) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Get reviewer username
  const { data: reviewer } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  await createNotification({
    userId: revieweeId,
    type: 'review_received',
    title: 'New review',
    body: `${reviewer?.username ?? 'Someone'} left you a ${rating}-star review`,
    link: tradeId ? `/trades/${tradeId}` : `/profile/${reviewer?.username}`,
  })

  return NextResponse.json({ ok: true })
}
