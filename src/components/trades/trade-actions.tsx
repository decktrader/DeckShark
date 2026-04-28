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
import { updateUser } from '@/lib/services/users'
import type { Trade, Deck, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CounterOfferForm } from './counter-offer-form'

type TradeParticipant = Pick<
  User,
  'id' | 'username' | 'city' | 'province' | 'discord_username' | 'phone_number'
>

export function TradeActions({
  trade,
  userId,
  myAvailableDecks,
  theirAvailableDecks,
  currentMyDeckIds,
  currentTheirDeckIds,
  isCashOnly,
  myProfile,
  theirProfile,
  email,
}: {
  trade: Trade
  userId: string
  myAvailableDecks?: Deck[]
  theirAvailableDecks?: Deck[]
  currentMyDeckIds?: string[]
  currentTheirDeckIds?: string[]
  isCashOnly?: boolean
  myProfile?: TradeParticipant
  theirProfile?: TradeParticipant
  email?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replyText, setReplyText] = useState(trade.receiver_message ?? '')
  const [replySaved, setReplySaved] = useState(false)
  const [showCounterForm, setShowCounterForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [discord, setDiscord] = useState(myProfile?.discord_username ?? '')
  const [phone, setPhone] = useState(myProfile?.phone_number ?? '')

  const isProposer = userId === trade.proposer_id
  const isReceiver = userId === trade.receiver_id
  const role = isProposer ? 'proposer' : 'receiver'
  const theirUserId = isProposer ? trade.receiver_id : trade.proposer_id

  // Who can act on a countered trade? The person who did NOT send the last counter.
  // On a fresh "proposed" trade, the receiver can act.
  const canAct =
    trade.status === 'proposed'
      ? isReceiver
      : trade.status === 'countered'
        ? trade.last_counter_by !== userId
        : false

  const myContactShared = isProposer
    ? trade.proposer_contact_shared
    : trade.receiver_contact_shared
  const theirContactShared = isProposer
    ? trade.receiver_contact_shared
    : trade.proposer_contact_shared

  const hasExtraContact = !!(
    myProfile?.discord_username || myProfile?.phone_number
  )

  async function notifyTrade(event: 'accepted' | 'declined' | 'completed') {
    await fetch('/api/notify/trade', {
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
      if (notifyEvent) await notifyTrade(notifyEvent)
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

  async function handleShareContact() {
    setLoading('contact')
    setError(null)

    // Save any new contact details to profile first
    if (
      discord !== (myProfile?.discord_username ?? '') ||
      phone !== (myProfile?.phone_number ?? '')
    ) {
      await updateUser(userId, {
        discord_username: discord || null,
        phone_number: phone || null,
      })
    }

    const { error: err } = await shareContact(trade.id, role)
    if (err) {
      setError(err)
      setLoading(null)
    } else {
      router.refresh()
      setLoading(null)
    }
  }

  // ─── Proposed or Countered ──────────────────────────────────────────────────
  if (trade.status === 'proposed' || trade.status === 'countered') {
    if (showCounterForm && myAvailableDecks && theirAvailableDecks) {
      return (
        <CounterOfferForm
          trade={trade}
          userId={userId}
          theirUserId={theirUserId}
          myDecks={myAvailableDecks}
          theirDecks={theirAvailableDecks}
          currentMyDeckIds={currentMyDeckIds ?? []}
          currentTheirDeckIds={currentTheirDeckIds ?? []}
          isCashOnly={isCashOnly}
          onCancel={() => setShowCounterForm(false)}
        />
      )
    }

    return (
      <div className="space-y-3">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {canAct && (
          <>
            {trade.status === 'proposed' && (
              <div>
                <Textarea
                  placeholder="Send a message back (optional)..."
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
                    ? 'Sending...'
                    : replySaved
                      ? 'Message sent'
                      : 'Send message'}
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={loading === 'accept'}
                onClick={() =>
                  run('accept', () => acceptTrade(trade.id), 'accepted')
                }
              >
                {loading === 'accept' ? 'Accepting...' : 'Accept'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={loading === 'decline'}
                onClick={() =>
                  run('decline', () => declineTrade(trade.id), 'declined')
                }
              >
                {loading === 'decline' ? 'Declining...' : 'Decline'}
              </Button>
            </div>
            {myAvailableDecks && theirAvailableDecks && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowCounterForm(true)}
              >
                Counter-offer
              </Button>
            )}
          </>
        )}

        {!canAct && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {trade.status === 'countered'
                ? 'Waiting for their response to your counter-offer...'
                : 'Waiting for their response...'}
            </p>
            <Button
              variant="outline"
              className="w-full"
              disabled={loading === 'cancel'}
              onClick={() => run('cancel', () => cancelTrade(trade.id))}
            >
              {loading === 'cancel' ? 'Cancelling...' : 'Cancel proposal'}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // ─── Accepted ─────────────────────────────────────────────────────────────
  if (trade.status === 'accepted') {
    return (
      <div className="space-y-3">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {!myContactShared ? (
          showContactForm || !hasExtraContact ? (
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/[3%] p-4">
              <p className="text-sm font-semibold">
                Add contact details before sharing
              </p>
              <p className="text-muted-foreground text-xs">
                These are optional but help coordinate the meetup. Your email (
                {email ?? 'on file'}) is always shared.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="trade-discord" className="text-xs">
                    Discord username
                  </Label>
                  <Input
                    id="trade-discord"
                    placeholder="e.g. player#1234"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trade-phone" className="text-xs">
                    Phone number
                  </Label>
                  <Input
                    id="trade-phone"
                    type="tel"
                    placeholder="e.g. 604-555-1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={loading === 'contact'}
                onClick={handleShareContact}
              >
                {loading === 'contact' ? 'Sharing...' : 'Share my contact info'}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              disabled={loading === 'contact'}
              onClick={() => setShowContactForm(true)}
            >
              {loading === 'contact' ? 'Sharing...' : 'Share my contact info'}
            </Button>
          )
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              You shared your contact info.
              {!theirContactShared && ' Waiting for them to share theirs.'}
            </p>

            {theirContactShared && theirProfile && (
              <>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="mb-2 text-xs font-semibold text-emerald-400">
                    {theirProfile.username}&apos;s contact info
                  </p>
                  <div className="space-y-1.5">
                    {email && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground shrink-0"
                        >
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-muted-foreground">
                          Email visible on their profile
                        </span>
                      </div>
                    )}
                    {theirProfile.discord_username && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="shrink-0 text-[#5865F2]"
                        >
                          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                        </svg>
                        <span>{theirProfile.discord_username}</span>
                      </div>
                    )}
                    {theirProfile.phone_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground shrink-0"
                        >
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        <span>{theirProfile.phone_number}</span>
                      </div>
                    )}
                    {!theirProfile.discord_username &&
                      !theirProfile.phone_number && (
                        <p className="text-muted-foreground text-xs">
                          No Discord or phone shared — check their profile
                          email.
                        </p>
                      )}
                  </div>
                </div>

                {/* Meetup suggestions */}
                <div className="mt-3">
                  <p className="text-center text-sm font-bold">
                    Where to meet up?
                  </p>
                  <p className="text-muted-foreground mb-3 text-center text-xs">
                    Trade somewhere public and safe.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[3%] px-3 py-4 text-center">
                      <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-purple-400"
                        >
                          <path d="m16 6 4 14" />
                          <path d="M12 6v14" />
                          <path d="M8 8v12" />
                          <path d="M4 4v16" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold">Local game store</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Public, familiar, and you might get a game in after.
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[3%] px-3 py-4 text-center">
                      <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-amber-400"
                        >
                          <path d="M10 2v2" />
                          <path d="M14 2v2" />
                          <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1" />
                          <path d="M6 2v2" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold">Coffee shop</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Grab a coffee, check the cards, and make the swap.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          disabled={loading === 'complete'}
          onClick={() =>
            run('complete', () => completeTrade(trade.id), 'completed')
          }
        >
          {loading === 'complete' ? 'Confirming...' : 'Confirm trade complete'}
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
