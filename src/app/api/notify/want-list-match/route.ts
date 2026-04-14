import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendWantListMatchEmail } from '@/lib/services/email'
import { checkRateLimit, getIp, notifyLimiter } from '@/lib/rate-limit'
import { createNotification } from '@/lib/services/notifications.server'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getUserEmail(userId: string): Promise<string | null> {
  const admin = adminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data.user) return null
  return data.user.email ?? null
}

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

  // Fetch the deck — RLS ensures only the owner or public decks are readable
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('*, owner:users!user_id(id, username)')
    .eq('id', deckId)
    .single()

  if (deckError || !deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  // Caller must own the deck
  if (authUser.id !== deck.user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch all active want lists owned by others
  const { data: wantLists } = await supabase
    .from('want_lists')
    .select('*, owner:users!user_id(id, username, notification_preferences)')
    .eq('status', 'active')
    .neq('user_id', deck.user_id)

  if (!wantLists || wantLists.length === 0) {
    return NextResponse.json({ ok: true, matched: 0 })
  }

  // Filter want lists that match this deck
  const matched = wantLists.filter((wl) => {
    if (wl.format && wl.format !== deck.format) return false
    if (wl.archetype && wl.archetype !== deck.archetype) return false
    if (wl.commander_name) {
      const wantedCmd = wl.commander_name.toLowerCase()
      const deckCmds = [deck.commander_name, deck.partner_commander_name]
        .filter(Boolean)
        .map((n: string) => n.toLowerCase())
      if (!deckCmds.some((c) => c.includes(wantedCmd))) return false
    }
    if (
      wl.min_value_cents &&
      (deck.estimated_value_cents ?? 0) < wl.min_value_cents
    )
      return false
    if (
      wl.max_value_cents &&
      (deck.estimated_value_cents ?? 0) > wl.max_value_cents
    )
      return false
    return true
  })

  const owner = deck.owner as { id: string; username: string }

  // Send email to each matching want list owner
  let sent = 0
  await Promise.all(
    matched.map(async (wl) => {
      const wlOwner = wl.owner as {
        id: string
        username: string
        notification_preferences: { want_list_matches: boolean }
      }
      // Always create in-app notification
      await createNotification({
        userId: wlOwner.id,
        type: 'want_list_match',
        title: 'Want list match found',
        body: `${deck.name} by ${owner.username} matches your "${wl.title}" list`,
        link: `/want-lists/${wl.id}`,
      })

      if (wlOwner.notification_preferences?.want_list_matches === false) return

      const email = await getUserEmail(wlOwner.id)
      if (!email) return

      await sendWantListMatchEmail({
        to: email,
        username: wlOwner.username,
        wantListTitle: wl.title,
        wantListId: wl.id,
        deckName: deck.name,
        deckOwnerUsername: owner.username,
        deckId: deck.id,
      })
      sent++
    }),
  )

  return NextResponse.json({ ok: true, matched: matched.length, sent })
}
