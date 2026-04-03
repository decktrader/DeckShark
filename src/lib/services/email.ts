import { Resend } from 'resend'

type DeckSummary = {
  name: string
  commander_name: string | null
  format: string
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM ?? 'DeckTrader <noreply@decktrader.ca>'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err)
  }
}

function tradeUrl(tradeId: string) {
  return `${APP_URL}/trades/${tradeId}`
}

function emailWrapper(body: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
      <p style="font-size:18px;font-weight:700;margin:0 0 20px">DeckTrader</p>
      ${body}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0"/>
      <p style="font-size:12px;color:#888">
        You're receiving this because you have trade notifications enabled.
        <a href="${APP_URL}/settings" style="color:#888">Manage preferences</a>
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
  receiverUsername,
  proposerUsername,
  tradeId,
  message,
  proposerDecks = [],
  receiverDecks = [],
}: {
  to: string
  receiverUsername: string
  proposerUsername: string
  tradeId: string
  message?: string | null
  proposerDecks?: DeckSummary[]
  receiverDecks?: DeckSummary[]
}) {
  const html = emailWrapper(`
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
  `)
  await send(
    to,
    `New trade proposal from ${proposerUsername} [${tradeId.slice(0, 8)}]`,
    html,
  )
}

// ─── Trade Accepted ──────────────────────────────────────────────────────────

export async function sendTradeAcceptedEmail({
  to,
  proposerUsername,
  receiverUsername,
  tradeId,
  proposerDecks = [],
  receiverDecks = [],
}: {
  to: string
  proposerUsername: string
  receiverUsername: string
  tradeId: string
  proposerDecks?: DeckSummary[]
  receiverDecks?: DeckSummary[]
}) {
  const html = emailWrapper(`
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
  `)
  await send(
    to,
    `${receiverUsername} accepted your trade proposal [${tradeId.slice(0, 8)}]`,
    html,
  )
}

// ─── Trade Declined ──────────────────────────────────────────────────────────

export async function sendTradeDeclinedEmail({
  to,
  proposerUsername,
  receiverUsername,
  tradeId,
}: {
  to: string
  proposerUsername: string
  receiverUsername: string
  tradeId: string
}) {
  const html = emailWrapper(`
    <p style="font-size:20px;font-weight:700;margin:0 0 8px">Trade declined</p>
    <p style="color:#555;margin:0 0 16px">Hi ${proposerUsername},</p>
    <p style="color:#555;margin:0 0 16px">
      <strong>${receiverUsername}</strong> declined your trade proposal.
      Browse other available decks to find your next trade.
    </p>
    ${ctaButton(`${APP_URL}/decks`, 'Browse decks')}
  `)
  await send(
    to,
    `${receiverUsername} declined your trade proposal [${tradeId.slice(0, 8)}]`,
    html,
  )
}

// ─── Trade Counter-Offered ───────────────────────────────────────────────────

export async function sendTradeCounteredEmail({
  to,
  recipientUsername,
  counterByUsername,
  tradeId,
  counterByDecks = [],
  recipientDecks = [],
  message,
}: {
  to: string
  recipientUsername: string
  counterByUsername: string
  tradeId: string
  counterByDecks?: DeckSummary[]
  recipientDecks?: DeckSummary[]
  message?: string | null
}) {
  const html = emailWrapper(`
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
  `)
  await send(
    to,
    `Counter-offer from ${counterByUsername} [${tradeId.slice(0, 8)}]`,
    html,
  )
}

// ─── Trade Completed ─────────────────────────────────────────────────────────

export async function sendTradeCompletedEmail({
  to,
  username,
  otherUsername,
  tradeId,
  myDecks = [],
  theirDecks = [],
}: {
  to: string
  username: string
  otherUsername: string
  tradeId: string
  myDecks?: DeckSummary[]
  theirDecks?: DeckSummary[]
}) {
  const html = emailWrapper(`
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
  `)
  await send(
    to,
    `Trade complete with ${otherUsername} [${tradeId.slice(0, 8)}]`,
    html,
  )
}

// ─── Want List Match ─────────────────────────────────────────────────────────

export async function sendWantListMatchEmail({
  to,
  username,
  wantListTitle,
  wantListId,
  deckName,
  deckOwnerUsername,
  deckId,
}: {
  to: string
  username: string
  wantListTitle: string
  wantListId: string
  deckName: string
  deckOwnerUsername: string
  deckId: string
}) {
  const html = emailWrapper(`
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
  `)
  await send(to, `Deck match found for "${wantListTitle}"`, html)
}
