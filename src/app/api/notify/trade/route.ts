import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  sendTradeProposedEmail,
  sendTradeAcceptedEmail,
  sendTradeDeclinedEmail,
  sendTradeCounteredEmail,
  sendTradeCompletedEmail,
} from '@/lib/services/email'
import { checkRateLimit, getIp, notifyLimiter } from '@/lib/rate-limit'
import { createNotification } from '@/lib/services/notifications.server'

type TradeEvent =
  | 'proposed'
  | 'accepted'
  | 'declined'
  | 'countered'
  | 'completed'
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
  const { success } = await checkRateLimit(notifyLimiter, getIp(request))
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    )
  }

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
      // Always create in-app notification
      await createNotification({
        userId: receiver.id,
        type: 'trade_proposed',
        title: 'New trade proposal',
        body: `${proposer.username} wants to trade for your deck`,
        link: `/trades/${tradeId}`,
      })
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
      await createNotification({
        userId: proposer.id,
        type: 'trade_accepted',
        title: 'Trade accepted!',
        body: `${receiver.username} accepted your trade proposal`,
        link: `/trades/${tradeId}`,
      })
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
      await createNotification({
        userId: proposer.id,
        type: 'trade_declined',
        title: 'Trade declined',
        body: `${receiver.username} declined your trade proposal`,
        link: `/trades/${tradeId}`,
      })
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
    } else if (event === 'countered') {
      // Notify the other party (the one who didn't counter)
      const otherPartyId =
        authUser.id === trade.proposer_id ? receiver.id : proposer.id
      const otherParty = authUser.id === trade.proposer_id ? receiver : proposer
      const counterBy = authUser.id === trade.proposer_id ? proposer : receiver

      // From the counter-er's perspective: their decks and the recipient's decks
      const counterByDecks =
        authUser.id === trade.proposer_id ? proposerDecks : receiverDecks
      const recipientDecks =
        authUser.id === trade.proposer_id ? receiverDecks : proposerDecks

      await createNotification({
        userId: otherPartyId,
        type: 'trade_countered',
        title: 'Counter-offer received',
        body: `${counterBy.username} countered your trade offer`,
        link: `/trades/${tradeId}`,
      })
      if (otherParty.notification_preferences?.trade_updates !== false) {
        const email = await getUserEmail(otherPartyId)
        if (email) {
          await sendTradeCounteredEmail({
            to: email,
            recipientUsername: otherParty.username,
            counterByUsername: counterBy.username,
            tradeId,
            counterByDecks,
            recipientDecks,
            message: trade.receiver_message,
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

      const myUsername =
        authUser.id === trade.proposer_id
          ? proposer.username
          : receiver.username
      await createNotification({
        userId: otherPartyId,
        type: 'trade_completed',
        title: 'Trade completed',
        body: `Your trade with ${myUsername} has been marked as complete`,
        link: `/trades/${tradeId}`,
      })
      if (otherPartyPrefs.notification_preferences?.trade_updates !== false) {
        const email = await getUserEmail(otherPartyId)
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
