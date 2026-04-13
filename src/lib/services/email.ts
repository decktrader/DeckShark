import { Resend } from 'resend'
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

/**
 * Send an email with List-Unsubscribe headers for deliverability.
 * Pass userId to generate HMAC-signed unsubscribe links.
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
  try {
    const headers: Record<string, string> = {}
    if (userId) {
      const unsub = unsubscribeUrl(userId)
      headers['List-Unsubscribe'] = `<${unsub}>`
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    }
    await resend.emails.send({ from: FROM, to, subject, html, headers })
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err)
  }
}

function tradeUrl(tradeId: string) {
  return `${APP_URL}/trades/${tradeId}`
}

function emailWrapper(body: string, userId?: string) {
  const unsubLink = userId ? unsubscribeUrl(userId) : `${APP_URL}/settings`
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
      <p style="font-size:18px;font-weight:700;margin:0 0 4px;color:#7c3aed">DeckShark<span style="color:#a78bfa">.gg</span></p>
      <p style="font-size:12px;color:#888;margin:0 0 20px">Trade decks. Not cards.</p>
      ${body}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0"/>
      <p style="font-size:12px;color:#888">
        You're receiving this because you have notifications enabled on DeckShark.
        <a href="${APP_URL}/settings" style="color:#888">Manage preferences</a>
        &nbsp;·&nbsp;
        <a href="${unsubLink}" style="color:#888">Unsubscribe</a>
      </p>
    </div>
  `
}

function deckList(decks: DeckSummary[]) {
  if (!decks.length)
    return '<p style="color:#888;font-size:13px">No decks listed</p>'
  return `<ul style="margin:4px 0;padding-left:18px">${decks
    .map(
      (d) =>
        `<li style="margin:3px 0"><strong>${d.name}</strong>${d.commander_name ? ` — ${d.commander_name}` : ''} <span style="color:#888;font-size:12px;text-transform:capitalize">(${d.format})</span></li>`,
    )
    .join('')}</ul>`
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;margin-top:16px">${label}</a>`
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
    <p style="color:#555;margin:0 0 16px">Hi ${receiverUsername},</p>
    <p style="color:#555;margin:0 0 8px">
      <strong>${proposerUsername}</strong> wants to trade decks with you.
    </p>
    <p style="font-weight:600;margin:16px 0 4px">They're offering:</p>
    ${deckList(proposerDecks)}
    <p style="font-weight:600;margin:16px 0 4px">In exchange for:</p>
    ${deckList(receiverDecks)}
    ${message ? `<p style="background:#f4f4f5;border-radius:6px;padding:12px;font-size:14px;color:#555;margin:16px 0 0">"${message}"</p>` : ''}
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
    <p style="color:#555;margin:0 0 16px">Hi ${proposerUsername},</p>
    <p style="color:#555;margin:0 0 8px">
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
    <p style="color:#555;margin:0 0 16px">Hi ${proposerUsername},</p>
    <p style="color:#555;margin:0 0 16px">
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
    <p style="color:#555;margin:0 0 16px">Hi ${recipientUsername},</p>
    <p style="color:#555;margin:0 0 8px">
      <strong>${counterByUsername}</strong> sent a counter-offer on your trade.
    </p>
    <p style="font-weight:600;margin:16px 0 4px">They're now offering:</p>
    ${deckList(counterByDecks)}
    <p style="font-weight:600;margin:16px 0 4px">In exchange for:</p>
    ${deckList(recipientDecks)}
    ${message ? `<p style="background:#f4f4f5;border-radius:6px;padding:12px;font-size:14px;color:#555;margin:16px 0 0">"${message}"</p>` : ''}
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
    <p style="color:#555;margin:0 0 16px">Hi ${username},</p>
    <p style="color:#555;margin:0 0 8px">
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
    <p style="color:#555;margin:0 0 16px">Hi ${username},</p>
    <p style="color:#555;margin:0 0 8px">
      A new deck matching your want list <strong>"${wantListTitle}"</strong> is now available:
    </p>
    <div style="background:#f4f4f5;border-radius:6px;padding:12px;margin:0 0 16px">
      <p style="margin:0;font-weight:600">${deckName}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#555">by ${deckOwnerUsername}</p>
    </div>
    <div style="display:flex;gap:8px">
      ${ctaButton(`${APP_URL}/decks/${deckId}`, 'View deck')}
    </div>
    <p style="margin-top:12px">
      <a href="${APP_URL}/want-lists/${wantListId}" style="font-size:13px;color:#555">View your want list</a>
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
      <div style="background:#f4f4f5;border-radius:8px;padding:12px;margin:0 0 8px">
        <p style="margin:0;font-weight:600;font-size:14px">${d.name}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#555">
          ${d.commander ? `${d.commander} · ` : ''}${d.format}${d.value ? ` · ${d.value}` : ''}${d.city ? ` · ${d.city}` : ''}
        </p>
      </div>`,
    )
    .join('')
  return `
    <p style="font-weight:600;margin:20px 0 8px;font-size:14px;color:#18181b">Recently listed for trade:</p>
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
    <p style="color:#555;margin:0 0 16px">Hi ${username},</p>
    <p style="color:#555;margin:0 0 8px">
      It's been a while since you visited DeckShark. Traders${cityText} are browsing — come see what's new.
    </p>
    ${featuredDecksHtml(featuredDecks)}
    ${ctaButton(`${APP_URL}/decks`, 'Browse decks near you')}
    <p style="margin-top:16px;font-size:13px;color:#888">
      Have decks to trade? <a href="${APP_URL}/decks/new" style="color:#7c3aed">List one now</a> — it takes 2 minutes.
    </p>
  `,
    userId,
  )
  await send(to, `Your decks are waiting, ${username}`, html, userId)
}
