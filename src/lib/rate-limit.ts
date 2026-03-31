// Simple sliding-window rate limiter.
// NOTE: In-memory only — effective for single warm instances and development.
// Replace with Upstash Redis (@upstash/ratelimit) for production scale.

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

interface RateLimitOptions {
  /** Max requests per window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

/** Extract a rate-limit key from a Next.js Request (IP + optional suffix). */
export function rateLimitKey(request: Request, suffix = ''): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  return suffix ? `${ip}:${suffix}` : ip
}
