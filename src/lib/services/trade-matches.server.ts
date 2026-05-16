import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/services/notifications.server'
import { sendTradeMatchEmail } from '@/lib/services/email'
import type { ServiceResponse, TradeMatch } from '@/types'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export interface TradeMatchWithDetails extends TradeMatch {
  user_deck: {
    id: string
    name: string
    commander_name: string | null
    commander_scryfall_id: string | null
    format: string
    estimated_value_cents: number | null
  }
  matched_deck: {
    id: string
    name: string
    commander_name: string | null
    commander_scryfall_id: string | null
    format: string
    estimated_value_cents: number | null
    owner: {
      id: string
      username: string
      city: string | null
      avatar_url: string | null
      trade_rating: number
      completed_trades: number
    }
  }
}

/**
 * Calculate match score between two decks (0-100).
 * Factors: value proximity, format match, color identity overlap.
 */
function calculateMatchScore(
  deck: {
    estimated_value_cents: number | null
    format: string
    color_identity: string[]
  },
  other: {
    estimated_value_cents: number | null
    format: string
    color_identity: string[]
  },
): number {
  let score = 0

  // Value proximity (max 50 points) — closer values = better match
  const v1 = deck.estimated_value_cents ?? 0
  const v2 = other.estimated_value_cents ?? 0
  if (v1 > 0 && v2 > 0) {
    const avg = (v1 + v2) / 2
    const diff = Math.abs(v1 - v2)
    const ratio = 1 - Math.min(diff / avg, 1)
    score += Math.round(ratio * 50)
  }

  // Format match (25 points)
  if (deck.format === other.format) {
    score += 25
  }

  // Color identity overlap (max 25 points)
  if (deck.color_identity.length > 0 && other.color_identity.length > 0) {
    const overlap = deck.color_identity.filter((c) =>
      other.color_identity.includes(c),
    ).length
    const totalUnique = new Set([
      ...deck.color_identity,
      ...other.color_identity,
    ]).size
    // Reward different colors (people usually trade for something different)
    const diversityScore = 1 - overlap / totalUnique
    score += Math.round(diversityScore * 25)
  } else {
    score += 12 // partial score when color identity unknown
  }

  return Math.min(100, score)
}

/**
 * Find and store trade matches for a given deck.
 * Called when a deck is listed for trade or its value updates.
 */
export async function findAndStoreMatches(deckId: string): Promise<{
  matched: number
  notified: number
}> {
  const admin = adminClient()

  // Fetch the source deck with owner info
  const { data: deck, error: deckErr } = await admin
    .from('decks')
    .select('*, owner:users!user_id(id, username, city, province, country)')
    .eq('id', deckId)
    .single()

  if (deckErr || !deck) return { matched: 0, notified: 0 }
  if (!deck.available_for_trade || deck.status !== 'active') {
    return { matched: 0, notified: 0 }
  }

  const owner = deck.owner as {
    id: string
    username: string
    city: string | null
    province: string | null
    country: string | null
  }

  // Find candidate decks: available for trade, different owner, same city or province
  let query = admin
    .from('decks')
    .select(
      '*, deck_owner:users!user_id(id, username, city, province, country, notification_preferences)',
    )
    .eq('available_for_trade', true)
    .eq('status', 'active')
    .neq('user_id', deck.user_id)

  // Prefer same city, fall back to same province/state
  if (owner.city) {
    query = query.eq('users.city', owner.city)
  }

  const { data: candidates } = await query

  if (!candidates || candidates.length === 0) return { matched: 0, notified: 0 }

  // Filter to same city/province and calculate scores
  const matches: Array<{
    candidateDeck: (typeof candidates)[0]
    score: number
    valueDiff: number
  }> = []

  for (const candidate of candidates) {
    const candOwner = candidate.deck_owner as {
      id: string
      username: string
      city: string | null
      province: string | null
      country: string | null
      notification_preferences: { trade_updates: boolean } | null
    }

    // Must be in same city or province
    const sameCity =
      owner.city &&
      candOwner.city &&
      owner.city.toLowerCase() === candOwner.city.toLowerCase()
    const sameProvince =
      owner.province &&
      candOwner.province &&
      owner.province.toLowerCase() === candOwner.province.toLowerCase()

    if (!sameCity && !sameProvince) continue

    // Value must be within 50% range to be a reasonable match
    const v1 = deck.estimated_value_cents ?? 0
    const v2 = candidate.estimated_value_cents ?? 0
    if (v1 > 0 && v2 > 0) {
      const ratio = Math.min(v1, v2) / Math.max(v1, v2)
      if (ratio < 0.5) continue // Too far apart in value
    }

    const score = calculateMatchScore(
      {
        estimated_value_cents: deck.estimated_value_cents,
        format: deck.format,
        color_identity: deck.color_identity ?? [],
      },
      {
        estimated_value_cents: candidate.estimated_value_cents,
        format: candidate.format,
        color_identity: candidate.color_identity ?? [],
      },
    )

    if (score >= 75) {
      // Only show quality matches — users should feel "this is a real trade"
      matches.push({
        candidateDeck: candidate,
        score,
        valueDiff: Math.abs(
          (deck.estimated_value_cents ?? 0) -
            (candidate.estimated_value_cents ?? 0),
        ),
      })
    }
  }

  // Sort by score descending, take top 10
  matches.sort((a, b) => b.score - a.score)
  const topMatches = matches.slice(0, 10)

  let matched = 0

  // Group matches by the OTHER user so we send one notification + one email per person
  const matchesByUser = new Map<
    string,
    {
      username: string
      notification_preferences: { trade_updates: boolean } | null
      items: typeof topMatches
    }
  >()

  for (const m of topMatches) {
    const candOwner = m.candidateDeck.deck_owner as {
      id: string
      username: string
      notification_preferences: { trade_updates: boolean } | null
    }

    // Upsert match for the deck owner (your deck → their deck)
    await admin.from('trade_matches').upsert(
      {
        user_id: deck.user_id,
        user_deck_id: deck.id,
        matched_deck_id: m.candidateDeck.id,
        matched_user_id: candOwner.id,
        match_score: m.score,
        value_diff_cents: m.valueDiff,
        status: 'active',
      },
      { onConflict: 'user_deck_id,matched_deck_id' },
    )

    // Upsert match for the other user (their deck → your deck)
    const { error: e2 } = await admin.from('trade_matches').upsert(
      {
        user_id: candOwner.id,
        user_deck_id: m.candidateDeck.id,
        matched_deck_id: deck.id,
        matched_user_id: deck.user_id,
        match_score: m.score,
        value_diff_cents: m.valueDiff,
        status: 'active',
      },
      { onConflict: 'user_deck_id,matched_deck_id' },
    )

    if (!e2) {
      matched++
      const existing = matchesByUser.get(candOwner.id)
      if (existing) {
        existing.items.push(m)
      } else {
        matchesByUser.set(candOwner.id, {
          username: candOwner.username,
          notification_preferences: candOwner.notification_preferences,
          items: [m],
        })
      }
    }
  }

  // Send ONE notification + ONE email per affected user
  let notified = 0
  for (const [userId, group] of matchesByUser) {
    const bestMatch = group.items[0] // highest score
    const count = group.items.length

    // One in-app notification summarizing all matches
    await createNotification({
      userId,
      type: 'trade_match',
      title: count === 1 ? 'Trade match found' : `${count} trade matches found`,
      body:
        count === 1
          ? `${owner.username}'s ${deck.name} (${formatValue(deck.estimated_value_cents)}) matches your ${bestMatch.candidateDeck.name} (${formatValue(bestMatch.candidateDeck.estimated_value_cents)}) — ${bestMatch.score}% match`
          : `${owner.username} listed ${deck.name} — it matches ${count} of your decks. Best match: ${bestMatch.score}%`,
      link: `/dashboard`,
    })
    notified++

    // One email with the best match (not one per match)
    if (group.notification_preferences?.trade_updates !== false) {
      const { data: authData } = await admin.auth.admin.getUserById(userId)
      if (authData?.user?.email) {
        await sendTradeMatchEmail({
          to: authData.user.email,
          userId,
          username: group.username,
          yourDeckName: bestMatch.candidateDeck.name,
          matchedDeckName: deck.name,
          matchedDeckOwner: owner.username,
          matchScore: bestMatch.score,
          valueDiff: bestMatch.valueDiff,
          matchedDeckId: deck.id,
        })
      }
    }
  }

  return { matched, notified }
}

function formatValue(cents: number | null): string {
  if (!cents) return '$0'
  return `$${Math.round(cents / 100)}`
}

/** Get active trade matches for a user's dashboard */
export async function getUserTradeMatches(
  userId: string,
): Promise<ServiceResponse<TradeMatchWithDetails[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trade_matches')
    .select(
      `
      *,
      user_deck:decks!user_deck_id(id, name, commander_name, commander_scryfall_id, format, estimated_value_cents),
      matched_deck:decks!matched_deck_id(
        id, name, commander_name, commander_scryfall_id, format, estimated_value_cents,
        owner:users!user_id(id, username, city, avatar_url, trade_rating, completed_trades)
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('match_score', { ascending: false })
    .limit(10)

  if (error) return { data: null, error: error.message }
  return { data: data as TradeMatchWithDetails[], error: null }
}

/** Dismiss a trade match */
export async function dismissTradeMatch(
  matchId: string,
): Promise<ServiceResponse<null>> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('trade_matches')
    .update({ status: 'dismissed' })
    .eq('id', matchId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
