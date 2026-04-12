import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Gracefully handle missing Upstash credentials (local dev without Redis).
// Falls back to unlimited when env vars aren't set.
const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasRedis ? Redis.fromEnv() : undefined

// --- Pre-built limiters for different route tiers ---

/** Public search endpoints — generous but bounded */
export const searchLimiter = hasRedis
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      prefix: 'rl:search',
    })
  : null

/** Authenticated mutations — moderate */
export const mutationLimiter = hasRedis
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      prefix: 'rl:mutation',
    })
  : null

/** Auth-related routes — strict to prevent brute force */
export const authLimiter = hasRedis
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      prefix: 'rl:auth',
    })
  : null

/** Notification sending — prevent email spam */
export const notifyLimiter = hasRedis
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(20, '60 s'),
      prefix: 'rl:notify',
    })
  : null

// --- Helpers ---

/** Extract IP from request for use as rate-limit identifier. */
export function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  )
}

/**
 * Check rate limit. Returns { success, remaining }.
 * When Upstash isn't configured (local dev), always allows.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) return { success: true, remaining: 999 }

  const result = await limiter.limit(identifier)
  return { success: result.success, remaining: result.remaining }
}
