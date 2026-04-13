import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReEngagementEmail } from '@/lib/services/email'

// Service role client — bypasses RLS
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, serviceKey)
}

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Call the RPC to get inactive users eligible for nudge
  const { data: users, error } = await admin.rpc(
    'get_inactive_users_for_nudge',
    { batch_limit: 50 },
  )

  if (error) {
    console.error('[NUDGE] RPC error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inactive users' },
      { status: 500 },
    )
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No inactive users to nudge' })
  }

  // Fetch 4 recent trade-available decks to feature in emails
  const { data: featuredDecks } = await admin
    .from('decks')
    .select(
      'name, commander_name, format, estimated_value_cents, users!inner(city)',
    )
    .eq('available_for_trade', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(4)

  const deckPreviews = (featuredDecks ?? []).map((d) => ({
    name: d.name,
    commander: d.commander_name,
    format: d.format,
    value: d.estimated_value_cents
      ? `$${(d.estimated_value_cents / 100).toFixed(0)}`
      : null,
    city: (d.users as unknown as { city: string | null })?.city ?? null,
  }))

  let sent = 0
  const errors: string[] = []

  for (const user of users) {
    try {
      await sendReEngagementEmail({
        to: user.email,
        userId: user.user_id,
        username: user.username,
        city: user.city,
        featuredDecks: deckPreviews,
      })

      // Update last_nudge_sent_at
      const { error: updateError } = await admin
        .from('users')
        .update({ last_nudge_sent_at: new Date().toISOString() })
        .eq('id', user.user_id)

      if (updateError) {
        console.error(
          `[NUDGE] Failed to update last_nudge_sent_at for ${user.user_id}:`,
          updateError,
        )
      }

      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[NUDGE] Failed to send to ${user.user_id}:`, msg)
      errors.push(user.user_id)
    }
  }

  console.log(`[NUDGE] Sent ${sent}/${users.length} re-engagement emails`)

  return NextResponse.json({
    sent,
    total: users.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
