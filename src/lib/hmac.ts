import { createHmac } from 'crypto'

const HMAC_SECRET =
  process.env.HMAC_SECRET ?? process.env.CRON_SECRET ?? 'dev-hmac-secret'

/** Generate an HMAC-SHA256 signature for a user ID */
export function signUserId(userId: string): string {
  return createHmac('sha256', HMAC_SECRET).update(userId).digest('hex')
}

/** Verify an HMAC-SHA256 signature for a user ID */
export function verifyUserId(userId: string, signature: string): boolean {
  const expected = signUserId(userId)
  // Constant-time comparison
  if (expected.length !== signature.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return mismatch === 0
}

/** Build a full unsubscribe URL for a user */
export function unsubscribeUrl(userId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const sig = signUserId(userId)
  return `${appUrl}/api/email/unsubscribe?uid=${userId}&sig=${sig}`
}
