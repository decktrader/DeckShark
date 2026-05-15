import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = process.env.RESEND_FROM ?? 'DeckShark <noreply@deckshark.gg>'
const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL ?? 'feedback@deckshark.gg'

export async function POST(request: Request) {
  try {
    const { category, message, pageUrl } = await request.json()

    // Get username from auth session
    let username = 'Anonymous'
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()
        username = profile?.username ?? 'Anonymous'
      }
    } catch {
      /* non-critical */
    }

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    if (!resend) {
      console.log(
        `[FEEDBACK EMAIL] To: ${FEEDBACK_EMAIL} | Category: ${category} | From: ${username ?? 'anonymous'}`,
      )
      return NextResponse.json({ ok: true })
    }

    await resend.emails.send({
      from: FROM,
      to: FEEDBACK_EMAIL,
      subject: `[DeckShark Feedback] ${category ?? 'general'} — ${username ?? 'anonymous'}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px;">
          <h2 style="margin: 0 0 16px;">New Feedback</h2>
          <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
            <tr><td style="padding: 8px 12px; font-weight: bold; color: #888;">Category</td><td style="padding: 8px 12px;">${category ?? 'general'}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold; color: #888;">User</td><td style="padding: 8px 12px;">${username ?? 'Anonymous'}</td></tr>
            <tr><td style="padding: 8px 12px; font-weight: bold; color: #888;">Page</td><td style="padding: 8px 12px;">${pageUrl ?? 'unknown'}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; white-space: pre-wrap; font-size: 14px;">${message}</div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[FEEDBACK EMAIL] Failed:', err)
    return NextResponse.json({ ok: true }) // Don't fail the user's submission
  }
}
