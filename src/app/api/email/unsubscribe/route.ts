import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUserId } from '@/lib/hmac'

// Service role client to bypass RLS
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, serviceKey)
}

async function handleUnsubscribe(uid: string, sig: string) {
  // Validate params
  if (!uid || !sig) {
    return NextResponse.json(
      { error: 'Missing uid or sig parameter' },
      { status: 400 },
    )
  }

  // Verify HMAC
  if (!verifyUserId(uid, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // Update user
  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ email_updates_opt_in: false })
    .eq('id', uid)

  if (error) {
    console.error('[UNSUBSCRIBE] Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 },
    )
  }

  return null // success
}

// GET — browser click from email link
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid') ?? ''
  const sig = searchParams.get('sig') ?? ''

  const errorResponse = await handleUnsubscribe(uid, sig)
  if (errorResponse) return errorResponse

  // Return a simple HTML confirmation page
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed — DeckShark</title></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:60px auto;padding:24px;text-align:center;color:#1a1a1a">
  <h1 style="font-size:24px;margin:0 0 12px">Unsubscribed</h1>
  <p style="color:#555;margin:0 0 24px">You've been unsubscribed from DeckShark marketing emails. You'll still receive trade notifications.</p>
  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://deckshark.gg'}/settings" style="color:#7c3aed;font-size:14px">Manage all notification preferences</a>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// POST — RFC 8058 List-Unsubscribe-Post (one-click unsubscribe from email client)
export async function POST(request: Request) {
  // RFC 8058 sends body: List-Unsubscribe=One-Click
  // We read uid/sig from query params (same URL used for both GET and POST)
  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid') ?? ''
  const sig = searchParams.get('sig') ?? ''

  const errorResponse = await handleUnsubscribe(uid, sig)
  if (errorResponse) return errorResponse

  return NextResponse.json({ ok: true })
}
