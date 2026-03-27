import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  sendTradeProposedEmail,
  sendTradeAcceptedEmail,
  sendTradeDeclinedEmail,
  sendTradeCompletedEmail,
} from '@/lib/services/email'

type TradeEvent = 'proposed' | 'accepted' | 'declined' | 'completed'
type DeckSummary = {
  name: string
  commander_name: string | null
  format: string
}

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
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { tradeId, event } = body as { tradeId: string; event: TradeEvent }

  if (!tradeId || !event) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch the trade, both user profiles, and associated decks
  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .select(
      `*, proposer:users!proposer_id(id, username, notification_preferences), receiver:users!receiver_id(id, username, notification_preferences), trade_decks(offered_by, deck:decks(name, commander_name, format))`,
    )
    .eq('id', tradeId)
    .single()

  if (tradeError || !trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  // Caller must be a participant
  const isParticipant =
    authUser.id === trade.proposer_id || authUser.id === trade.receiver_id
  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const proposer = trade.proposer as {
    id: string
    username: string
    notification_preferences: { trade_updates: boolean }
  }
  const receiver = trade.receiver as {
    id: string
    username: string
    notification_preferences: { trade_updates: boolean }
  }

  const tradeDeckRows = (trade.trade_decks ?? []) as {
    offered_by: string
    deck: DeckSummary
  }[]
  const proposerDecks = tradeDeckRows
    .filter((td) => td.offered_by === trade.proposer_id)
    .map((td) => td.deck)
  const receiverDecks = tradeDeckRows
    .filter((td) => td.offered_by === trade.receiver_id)
    .map((td) => td.deck)

  try {
    if (event === 'proposed') {
      if (receiver.notification_preferences?.trade_updates !== false) {
        const email = await getUserEmail(receiver.id)
        if (email) {
          await sendTradeProposedEmail({
            to: email,
            receiverUsername: receiver.username,
            proposerUsername: proposer.username,
            tradeId,
            message: trade.message,
            proposerDecks,
            receiverDecks,
          })
        }
      }
    } else if (event === 'accepted') {
      if (proposer.notification_preferences?.trade_updates !== false) {
        const email = await getUserEmail(proposer.id)
        if (email) {
          await sendTradeAcceptedEmail({
            to: email,
            proposerUsername: proposer.username,
            receiverUsername: receiver.username,
            tradeId,
            proposerDecks,
            receiverDecks,
          })
        }
      }
    } else if (event === 'declined') {
      if (proposer.notification_preferences?.trade_updates !== false) {
        const email = await getUserEmail(proposer.id)
        if (email) {
          await sendTradeDeclinedEmail({
            to: email,
            proposerUsername: proposer.username,
            receiverUsername: receiver.username,
            tradeId,
          })
        }
      }
    } else if (event === 'completed') {
      // Notify both parties (the one who clicked "completed" and the other)
      const otherPartyId =
        authUser.id === trade.proposer_id ? receiver.id : proposer.id
      const otherPartyUsername =
        authUser.id === trade.proposer_id
          ? receiver.username
          : proposer.username
      const otherPartyPrefs =
        authUser.id === trade.proposer_id ? receiver : proposer

      // From the notified party's perspective: their decks vs the other's decks
      const myDecks =
        authUser.id === trade.proposer_id ? receiverDecks : proposerDecks
      const theirDecks =
        authUser.id === trade.proposer_id ? proposerDecks : receiverDecks

      if (otherPartyPrefs.notification_preferences?.trade_updates !== false) {
        const email = await getUserEmail(otherPartyId)
        const myUsername =
          authUser.id === trade.proposer_id
            ? proposer.username
            : receiver.username
        if (email) {
          await sendTradeCompletedEmail({
            to: email,
            username: otherPartyUsername,
            otherUsername: myUsername,
            tradeId,
            myDecks,
            theirDecks,
          })
        }
      }
    }
  } catch (err) {
    console.error('[notify/trade] Error sending email:', err)
  }

  return NextResponse.json({ ok: true })
}
