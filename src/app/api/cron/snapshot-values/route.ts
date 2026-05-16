import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendValueUpdateEmail } from '@/lib/services/email'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. Snapshot all deck values
  const { data: decks } = await admin
    .from('decks')
    .select('id, estimated_value_cents, previous_value_cents')
    .eq('status', 'active')

  if (!decks || decks.length === 0) {
    return NextResponse.json({ ok: true, snapshots: 0, emails: 0 })
  }

  // Insert snapshots
  const snapshots = decks
    .filter((d) => d.estimated_value_cents != null)
    .map((d) => ({
      deck_id: d.id,
      value_cents: d.estimated_value_cents!,
    }))

  if (snapshots.length > 0) {
    await admin.from('deck_value_snapshots').insert(snapshots)
  }

  // 2. Update previous_value_cents to current (for next week's delta)
  for (const deck of decks) {
    if (deck.estimated_value_cents !== deck.previous_value_cents) {
      await admin
        .from('decks')
        .update({ previous_value_cents: deck.estimated_value_cents })
        .eq('id', deck.id)
    }
  }

  // 3. Send weekly value emails to users with decks
  const { data: users } = await admin
    .from('users')
    .select('id, username, email_updates_opt_in')
    .eq('email_updates_opt_in', true)

  let emailsSent = 0

  if (users) {
    for (const user of users) {
      const { data: userDecks } = await admin
        .from('decks')
        .select('id, name, estimated_value_cents, previous_value_cents')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!userDecks || userDecks.length === 0) continue

      const totalValue = userDecks.reduce(
        (sum, d) => sum + (d.estimated_value_cents ?? 0),
        0,
      )

      // Skip users with no value
      if (totalValue === 0) continue

      const totalChange = userDecks.reduce((sum, d) => {
        const current = d.estimated_value_cents ?? 0
        const previous = d.previous_value_cents ?? current
        return sum + (current - previous)
      }, 0)

      const deckSummaries = userDecks.map((d) => ({
        name: d.name,
        value: d.estimated_value_cents ?? 0,
        change:
          (d.estimated_value_cents ?? 0) -
          (d.previous_value_cents ?? d.estimated_value_cents ?? 0),
        id: d.id,
      }))

      // Get user email
      const { data: authData } = await admin.auth.admin.getUserById(user.id)
      if (!authData?.user?.email) continue

      await sendValueUpdateEmail({
        to: authData.user.email,
        userId: user.id,
        username: user.username,
        totalValue,
        totalChange,
        deckSummaries,
      })
      emailsSent++
    }
  }

  return NextResponse.json({
    ok: true,
    snapshots: snapshots.length,
    emails: emailsSent,
  })
}
