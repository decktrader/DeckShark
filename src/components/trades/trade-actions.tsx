'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  acceptTrade,
  declineTrade,
  cancelTrade,
  completeTrade,
  shareContact,
} from '@/lib/services/trades'
import type { Trade } from '@/types'
import { Button } from '@/components/ui/button'

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

  const isProposer = userId === trade.proposer_id
  const isReceiver = userId === trade.receiver_id
  const role = isProposer ? 'proposer' : 'receiver'

  const myContactShared = isProposer
    ? trade.proposer_contact_shared
    : trade.receiver_contact_shared
  const theirContactShared = isProposer
    ? trade.receiver_contact_shared
    : trade.proposer_contact_shared

  async function run(
    action: string,
    fn: () => Promise<{ data: Trade | null; error: string | null }>,
  ) {
    setLoading(action)
    setError(null)
    const { error: err } = await fn()
    if (err) {
      setError(err)
      setLoading(null)
    } else {
      router.refresh()
      setLoading(null)
    }
  }

  if (trade.status === 'proposed') {
    return (
      <div className="space-y-2">
        {error && <p className="text-destructive text-sm">{error}</p>}
        {isReceiver && (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={loading === 'accept'}
              onClick={() => run('accept', () => acceptTrade(trade.id))}
            >
              {loading === 'accept' ? 'Accepting…' : 'Accept'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={loading === 'decline'}
              onClick={() => run('decline', () => declineTrade(trade.id))}
            >
              {loading === 'decline' ? 'Declining…' : 'Decline'}
            </Button>
          </div>
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
          onClick={() => run('complete', () => completeTrade(trade.id))}
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
