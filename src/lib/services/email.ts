import { Resend } from 'resend'
import * as Sentry from '@sentry/nextjs'
import { unsubscribeUrl } from '@/lib/hmac'

type DeckSummary = {
  name: string
  commander_name: string | null
  format: string
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM ?? 'DeckShark <noreply@deckshark.gg>'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

/**
 * Send an email with List-Unsubscribe headers for deliverability.
 * Retries transient failures (5xx, network errors) up to MAX_RETRIES times.
 * Never throws — logs errors to Sentry so callers are never blocked.
 */
async function send(
  to: string,
  subject: string,
  html: string,
  userId?: string,
) {
  if (!resend) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`)
    return
  }

  const headers: Record<string, string> = {}
  if (userId) {
    const unsub = unsubscribeUrl(userId)
    headers['List-Unsubscribe'] = `<${unsub}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await resend.emails.send({ from: FROM, to, subject, html, headers })
      return
    } catch (err) {
      const isLast = attempt === MAX_RETRIES
      if (isLast) {
        console.error(`[EMAIL] Failed after ${MAX_RETRIES + 1} attempts:`, err)
        Sentry.captureException(err, {
          tags: { service: 'email' },
          extra: { to, subject, attempts: attempt + 1 },
        })
        return
      }
      // Retry on transient errors with exponential backoff
      const delay = RETRY_DELAY_MS * 2 ** attempt
      console.warn(
        `[EMAIL] Attempt ${attempt + 1} failed, retrying in ${delay}ms`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
}

function tradeUrl(tradeId: string) {
  return `${APP_URL}/trades/${tradeId}`
}

function emailWrapper(body: string, userId?: string) {
  const unsubLink = userId ? unsubscribeUrl(userId) : `${APP_URL}/settings`
  return `
    <div style="font-family:'Figtree','Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#18222D;background:#F4F0E8">
      <p style="font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;font-size:19px;font-weight:700;margin:0 0 4px;color:#18222D">Deck<span style="color:#B45F42">Shark</span></p>
      <p style="font-size:12px;color:#5B6675;margin:0 0 20px">Trade decks. Not cards.</p>
      ${body}
      <hr style="border:none;border-top:1px solid #DAD2C2;margin:32px 0"/>
      <p style="font-size:12px;color:#5B6675">
        You're receiving this because you have notifications enabled on DeckShark.
        <a href="${APP_URL}/settings" style="color:#5B6675">Manage preferences</a>
        &nbsp;&middot;&nbsp;
        <a href="${unsubLink}" style="color:#5B6675">Unsubscribe</a>
      </p>
    </div>
  `
}

function deckList(decks: DeckSummary[]) {
  if (!decks.length)
    return '<p style="color:#5B6675;font-size:13px">No decks listed</p>'
  return `<ul style="margin:4px 0;padding-left:18px">${decks
    .map(
      (d) =>
        `<li style="margin:3px 0"><strong>${d.name}</strong>${d.commander_name ? ` &middot; ${d.commander_name}` : ''} <span style="color:#5B6675;font-size:12px;text-transform:capitalize">(${d.format})</span></li>`,
    )
    .join('')}</ul>`
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#B45F42;color:#F4F0E8;text-decoration:none;padding:11px 22px;border-radius:5px;font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;margin-top:16px">${label}</a>`
}

// ─── Trade Proposed ──────────────────────────────────────────────────────────

export async function sendTradeProposedEmail({
  to,
  userId,
  receiverUsername,
  proposerUsername,
  tradeId,
  message,
  proposerDecks = [],
  receiverDecks = [],
}: {
  to: string
  userId?: string
  receiverUsername: string
  proposerUsername: string
  tradeId: string
  message?: string | null
  proposerDecks?: DeckSummary[]
  receiverDecks?: DeckSummary[]
}) {
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">New trade proposal</p>
    <p style="color:#4A5562;margin:0 0 16px">Hi ${receiverUsername},</p>
    <p style="color:#4A5562;margin:0 0 8px">
      <strong>${proposerUsername}</strong> wants to trade decks with you.
    </p>
    <p style="font-weight:600;margin:16px 0 4px">They're offering:</p>
    ${deckList(proposerDecks)}
    <p style="font-weight:600;margin:16px 0 4px">In exchange for:</p>
    ${deckList(receiverDecks)}
    ${message ? `<p style="background:#ECE6D9;border-radius:6px;padding:12px;font-size:14px;color:#4A5562;margin:16px 0 0">"${message}"</p>` : ''}
    ${ctaButton(tradeUrl(tradeId), 'View proposal')}
  `,
    userId,
  )
  await send(
    to,
    `New trade proposal from ${proposerUsername} [${tradeId.slice(0, 8)}]`,
    html,
    userId,
  )
}

// ─── Trade Accepted ──────────────────────────────────────────────────────────

export async function sendTradeAcceptedEmail({
  to,
  userId,
  proposerUsername,
  receiverUsername,
  tradeId,
  proposerDecks = [],
  receiverDecks = [],
}: {
  to: string
  userId?: string
  proposerUsername: string
  receiverUsername: string
  tradeId: string
  proposerDecks?: DeckSummary[]
  receiverDecks?: DeckSummary[]
}) {
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">Trade accepted!</p>
    <p style="color:#4A5562;margin:0 0 16px">Hi ${proposerUsername},</p>
    <p style="color:#4A5562;margin:0 0 8px">
      <strong>${receiverUsername}</strong> accepted your trade proposal.
      Share your contact info to arrange the meetup.
    </p>
    <p style="font-weight:600;margin:16px 0 4px">You're giving:</p>
    ${deckList(proposerDecks)}
    <p style="font-weight:600;margin:16px 0 4px">You're receiving:</p>
    ${deckList(receiverDecks)}
    ${ctaButton(tradeUrl(tradeId), 'View trade')}
  `,
    userId,
  )
  await send(
    to,
    `${receiverUsername} accepted your trade proposal [${tradeId.slice(0, 8)}]`,
    html,
    userId,
  )
}

// ─── Trade Declined ──────────────────────────────────────────────────────────

export async function sendTradeDeclinedEmail({
  to,
  userId,
  proposerUsername,
  receiverUsername,
  tradeId,
}: {
  to: string
  userId?: string
  proposerUsername: string
  receiverUsername: string
  tradeId: string
}) {
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">Trade declined</p>
    <p style="color:#4A5562;margin:0 0 16px">Hi ${proposerUsername},</p>
    <p style="color:#4A5562;margin:0 0 16px">
      <strong>${receiverUsername}</strong> declined your trade proposal.
      Browse other available decks to find your next trade.
    </p>
    ${ctaButton(`${APP_URL}/decks`, 'Browse decks')}
  `,
    userId,
  )
  await send(
    to,
    `${receiverUsername} declined your trade proposal [${tradeId.slice(0, 8)}]`,
    html,
    userId,
  )
}

// ─── Trade Counter-Offered ───────────────────────────────────────────────────

export async function sendTradeCounteredEmail({
  to,
  userId,
  recipientUsername,
  counterByUsername,
  tradeId,
  counterByDecks = [],
  recipientDecks = [],
  message,
}: {
  to: string
  userId?: string
  recipientUsername: string
  counterByUsername: string
  tradeId: string
  counterByDecks?: DeckSummary[]
  recipientDecks?: DeckSummary[]
  message?: string | null
}) {
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">Counter-offer received</p>
    <p style="color:#4A5562;margin:0 0 16px">Hi ${recipientUsername},</p>
    <p style="color:#4A5562;margin:0 0 8px">
      <strong>${counterByUsername}</strong> sent a counter-offer on your trade.
    </p>
    <p style="font-weight:600;margin:16px 0 4px">They're now offering:</p>
    ${deckList(counterByDecks)}
    <p style="font-weight:600;margin:16px 0 4px">In exchange for:</p>
    ${deckList(recipientDecks)}
    ${message ? `<p style="background:#ECE6D9;border-radius:6px;padding:12px;font-size:14px;color:#4A5562;margin:16px 0 0">"${message}"</p>` : ''}
    ${ctaButton(tradeUrl(tradeId), 'View counter-offer')}
  `,
    userId,
  )
  await send(
    to,
    `Counter-offer from ${counterByUsername} [${tradeId.slice(0, 8)}]`,
    html,
    userId,
  )
}

// ─── Trade Completed ─────────────────────────────────────────────────────────

export async function sendTradeCompletedEmail({
  to,
  userId,
  username,
  otherUsername,
  tradeId,
  myDecks = [],
  theirDecks = [],
}: {
  to: string
  userId?: string
  username: string
  otherUsername: string
  tradeId: string
  myDecks?: DeckSummary[]
  theirDecks?: DeckSummary[]
}) {
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">Trade complete!</p>
    <p style="color:#4A5562;margin:0 0 16px">Hi ${username},</p>
    <p style="color:#4A5562;margin:0 0 8px">
      Your trade with <strong>${otherUsername}</strong> is complete.
      Don't forget to leave a review!
    </p>
    <p style="font-weight:600;margin:16px 0 4px">You gave:</p>
    ${deckList(myDecks)}
    <p style="font-weight:600;margin:16px 0 4px">You received:</p>
    ${deckList(theirDecks)}
    ${ctaButton(tradeUrl(tradeId), 'Leave a review')}
  `,
    userId,
  )
  await send(
    to,
    `Trade complete with ${otherUsername} [${tradeId.slice(0, 8)}]`,
    html,
    userId,
  )
}

// ─── Want List Match ─────────────────────────────────────────────────────────

export async function sendWantListMatchEmail({
  to,
  userId,
  username,
  wantListTitle,
  wantListId,
  deckName,
  deckOwnerUsername,
  deckId,
}: {
  to: string
  userId?: string
  username: string
  wantListTitle: string
  wantListId: string
  deckName: string
  deckOwnerUsername: string
  deckId: string
}) {
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">A deck matching your want list was just listed</p>
    <p style="color:#4A5562;margin:0 0 16px">Hi ${username},</p>
    <p style="color:#4A5562;margin:0 0 8px">
      A new deck matching your want list <strong>"${wantListTitle}"</strong> is now available:
    </p>
    <div style="background:#ECE6D9;border-radius:6px;padding:12px;margin:0 0 16px">
      <p style="margin:0;font-weight:600">${deckName}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#4A5562">by ${deckOwnerUsername}</p>
    </div>
    <div style="display:flex;gap:8px">
      ${ctaButton(`${APP_URL}/decks/${deckId}`, 'View deck')}
    </div>
    <p style="margin-top:12px">
      <a href="${APP_URL}/want-lists/${wantListId}" style="font-size:13px;color:#4A5562">View your want list</a>
    </p>
  `,
    userId,
  )
  await send(to, `Deck match found for "${wantListTitle}"`, html, userId)
}

// ─── Re-engagement Nudge ──────────────────────────────────────────────────────

type FeaturedDeckPreview = {
  name: string
  commander: string | null
  format: string
  value: string | null
  city: string | null
}

function featuredDecksHtml(decks: FeaturedDeckPreview[]) {
  if (!decks.length) return ''
  const cards = decks
    .map(
      (d) => `
      <div style="background:#ECE6D9;border-radius:8px;padding:12px;margin:0 0 8px">
        <p style="margin:0;font-weight:600;font-size:14px">${d.name}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#4A5562">
          ${d.commander ? `${d.commander} · ` : ''}${d.format}${d.value ? ` · ${d.value}` : ''}${d.city ? ` · ${d.city}` : ''}
        </p>
      </div>`,
    )
    .join('')
  return `
    <p style="font-weight:600;margin:20px 0 8px;font-size:14px;color:#18222D">Recently listed for trade:</p>
    ${cards}
  `
}

export async function sendReEngagementEmail({
  to,
  userId,
  username,
  city,
  featuredDecks = [],
}: {
  to: string
  userId: string
  username: string
  city: string | null
  featuredDecks?: FeaturedDeckPreview[]
}) {
  const cityText = city ? ` in ${city}` : ''
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">Your decks are waiting</p>
    <p style="color:#4A5562;margin:0 0 16px">Hi ${username},</p>
    <p style="color:#4A5562;margin:0 0 8px">
      It's been a while since you visited DeckShark. Traders${cityText} are browsing, come see what's new.
    </p>
    ${featuredDecksHtml(featuredDecks)}
    ${ctaButton(`${APP_URL}/decks`, 'Browse decks near you')}
    <p style="margin-top:16px;font-size:13px;color:#5B6675">
      Have decks to trade? <a href="${APP_URL}/decks/new" style="color:#9A4E35">List one now</a>, it takes 2 minutes.
    </p>
  `,
    userId,
  )
  await send(to, `Your decks are waiting, ${username}`, html, userId)
}

// ─── Interest Threshold ─────────────────────────────────────────────────────

export async function sendInterestThresholdEmail({
  to,
  userId,
  username,
  deckName,
  deckId,
  interestCount,
}: {
  to: string
  userId: string
  username: string
  deckName: string
  deckId: string
  interestCount: number
}) {
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">${interestCount} trader${interestCount !== 1 ? 's' : ''} interested in your deck</p>
    <p style="color:#4A5562;margin:0 0 8px">Hi ${username},</p>
    <p style="color:#4A5562;margin:0 0 16px">
      <strong>${interestCount} people</strong> have expressed interest in your deck <strong>${deckName}</strong>. They'd trade for it if shipping were available, stay tuned!
    </p>
    ${ctaButton(`${APP_URL}/decks/${deckId}`, 'View your deck')}
  `,
    userId,
  )
  await send(to, `${interestCount} traders want your ${deckName}`, html, userId)
}

// ─── Trade Match ──────────────────────────────────────────────────────────────

export async function sendTradeMatchEmail({
  to,
  userId,
  username,
  yourDeckName,
  matchedDeckName,
  matchedDeckOwner,
  matchScore,
  valueDiff,
  matchedDeckId,
}: {
  to: string
  userId: string
  username: string
  yourDeckName: string
  matchedDeckName: string
  matchedDeckOwner: string
  matchScore: number
  valueDiff: number
  matchedDeckId: string
}) {
  const diffText =
    valueDiff > 0
      ? `Value difference: $${Math.round(valueDiff / 100)} (can be balanced with cash)`
      : 'Values are closely matched'
  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">Trade match found</p>
    <p style="color:#4A5562;margin:0 0 8px">Hi ${username},</p>
    <p style="color:#4A5562;margin:0 0 16px">
      We found a <strong>${matchScore}% match</strong> for your deck <strong>${yourDeckName}</strong>:
    </p>
    <div style="background:#ECE6D9;border-radius:8px;padding:16px;margin:0 0 16px">
      <p style="margin:0;font-weight:700;font-size:16px">${matchedDeckName}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#4A5562">by ${matchedDeckOwner}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#5B6675">${diffText}</p>
    </div>
    ${ctaButton(`${APP_URL}/decks/${matchedDeckId}`, 'View deck & propose trade')}
  `,
    userId,
  )
  await send(
    to,
    `Trade match: ${matchedDeckName} for your ${yourDeckName}`,
    html,
    userId,
  )
}

// ─── Value Update (Weekly Portfolio) ──────────────────────────────────────────

export async function sendValueUpdateEmail({
  to,
  userId,
  username,
  totalValue,
  totalChange,
  deckSummaries,
}: {
  to: string
  userId: string
  username: string
  totalValue: number
  totalChange: number
  deckSummaries: Array<{
    name: string
    value: number
    change: number
    id: string
  }>
}) {
  const changeText =
    totalChange > 0
      ? `<span style="color:#2F605C">+$${Math.round(totalChange / 100)}</span>`
      : totalChange < 0
        ? `<span style="color:#9A4E35">-$${Math.round(Math.abs(totalChange) / 100)}</span>`
        : '<span style="color:#5B6675">No change</span>'

  const deckRows = deckSummaries
    .slice(0, 5)
    .map((d) => {
      const ch =
        d.change > 0
          ? `<span style="color:#2F605C">+$${Math.round(d.change / 100)}</span>`
          : d.change < 0
            ? `<span style="color:#9A4E35">-$${Math.round(Math.abs(d.change) / 100)}</span>`
            : ''
      return `<tr>
        <td style="padding:6px 0;font-size:14px"><a href="${APP_URL}/decks/${d.id}" style="color:#9A4E35;text-decoration:none">${d.name}</a></td>
        <td style="padding:6px 8px;font-size:14px;text-align:right">$${Math.round(d.value / 100)}</td>
        <td style="padding:6px 0;font-size:13px;text-align:right">${ch}</td>
      </tr>`
    })
    .join('')

  const html = emailWrapper(
    `
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">Your collection value</p>
    <p style="color:#4A5562;margin:0 0 16px">Hi ${username},</p>
    <div style="background:#18222D;border-radius:12px;padding:20px;margin:0 0 16px;text-align:center">
      <p style="font-size:32px;font-weight:800;color:#fff;margin:0">$${Math.round(totalValue / 100)}</p>
      <p style="font-size:14px;color:#8FBFB8;margin:4px 0 0">Collection value ${changeText} this week</p>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:1px solid #DAD2C2">
          <th style="padding:6px 0;font-size:12px;color:#5B6675;text-align:left">Deck</th>
          <th style="padding:6px 8px;font-size:12px;color:#5B6675;text-align:right">Value</th>
          <th style="padding:6px 0;font-size:12px;color:#5B6675;text-align:right">Change</th>
        </tr>
      </thead>
      <tbody>${deckRows}</tbody>
    </table>
    ${ctaButton(`${APP_URL}/dashboard`, 'View dashboard')}
  `,
    userId,
  )
  await send(
    to,
    `Your decks are worth $${Math.round(totalValue / 100)}`,
    html,
    userId,
  )
}
