'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  acceptTrade,
  declineTrade,
  cancelTrade,
  completeTrade,
  shareContact,
  replyToTrade,
} from '@/lib/services/trades'
import type { Trade } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function TradeActions({
  trade,
  userId,
}: {
  trade: Trade
  userId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replyText, setReplyText] = useState(trade.receiver_message ?? '')
  const [replySaved, setReplySaved] = useState(false)

  const isProposer = userId === trade.proposer_id
  const isReceiver = userId === trade.receiver_id
  const role = isProposer ? 'proposer' : 'receiver'

  const myContactShared = isProposer
    ? trade.proposer_contact_shared
    : trade.receiver_contact_shared
  const theirContactShared = isProposer
    ? trade.receiver_contact_shared
    : trade.proposer_contact_shared

  function notifyTrade(event: 'accepted' | 'declined' | 'completed') {
    fetch('/api/notify/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId: trade.id, event }),
    }).catch(() => {})
  }

  async function run(
    action: string,
    fn: () => Promise<{ data: Trade | null; error: string | null }>,
    notifyEvent?: 'accepted' | 'declined' | 'completed',
  ) {
    setLoading(action)
    setError(null)
    const { error: err } = await fn()
    if (err) {
      setError(err)
      setLoading(null)
    } else {
      if (notifyEvent) notifyTrade(notifyEvent)
      router.refresh()
      setLoading(null)
    }
  }

  async function handleReply() {
    setLoading('reply')
    setError(null)
    const { error: err } = await replyToTrade(trade.id, replyText)
    if (err) {
      setError(err)
    } else {
      setReplySaved(true)
    }
    setLoading(null)
  }

  if (trade.status === 'proposed') {
    return (
      <div className="space-y-3">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {isReceiver && (
          <>
            <div>
              <Textarea
                placeholder="Send a message back to the proposer (optional)…"
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value)
                  setReplySaved(false)
                }}
                rows={3}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-1.5 w-full"
                disabled={loading === 'reply' || !replyText.trim()}
                onClick={handleReply}
              >
                {loading === 'reply'
                  ? 'Sending…'
                  : replySaved
                    ? '✓ Message sent'
                    : 'Send message'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={loading === 'accept'}
                onClick={() =>
                  run('accept', () => acceptTrade(trade.id), 'accepted')
                }
              >
                {loading === 'accept' ? 'Accepting…' : 'Accept'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={loading === 'decline'}
                onClick={() =>
                  run('decline', () => declineTrade(trade.id), 'declined')
                }
              >
                {loading === 'decline' ? 'Declining…' : 'Decline'}
              </Button>
            </div>
          </>
        )}

        {isProposer && (
          <Button
            variant="outline"
            className="w-full"
            disabled={loading === 'cancel'}
            onClick={() => run('cancel', () => cancelTrade(trade.id))}
          >
            {loading === 'cancel' ? 'Cancelling…' : 'Cancel proposal'}
          </Button>
        )}
      </div>
    )
  }

  if (trade.status === 'accepted') {
    return (
      <div className="space-y-3">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {/* PIPEDA contact sharing */}
        {!myContactShared ? (
          <Button
            className="w-full"
            disabled={loading === 'contact'}
            onClick={() => run('contact', () => shareContact(trade.id, role))}
          >
            {loading === 'contact' ? 'Sharing…' : 'Share my contact info'}
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">
            ✓ You shared your contact info.
            {theirContactShared
              ? ' They have shared theirs too — check your profile email.'
              : ' Waiting for them to share theirs.'}
          </p>
        )}

        <Button
          variant="outline"
          className="w-full"
          disabled={loading === 'complete'}
          onClick={() =>
            run('complete', () => completeTrade(trade.id), 'completed')
          }
        >
          {loading === 'complete' ? 'Confirming…' : 'Confirm trade complete'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-destructive w-full"
          disabled={loading === 'cancel'}
          onClick={() => run('cancel', () => cancelTrade(trade.id))}
        >
          Cancel trade
        </Button>
      </div>
    )
  }

  return null
}
