import { describe, it, expect } from 'vitest'
import { isOnboardingComplete } from '../users'
import type { User } from '@/types'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: '123',
    username: 'testuser',
    avatar_url: null,
    bio: null,
    city: 'Toronto',
    province: 'ON',
    reputation_score: 0,
    completed_trades: 0,
    trade_rating: 0,
    notification_preferences: { trade_updates: true, want_list_matches: true },
    email_updates_opt_in: true,
    last_nudge_sent_at: null,
    is_admin: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('isOnboardingComplete', () => {
  it('returns true when username, city, and province are set', () => {
    expect(isOnboardingComplete(makeUser())).toBe(true)
  })

  it('returns false for auto-generated username', () => {
    expect(
      isOnboardingComplete(makeUser({ username: 'testuser_a1b2c3d4' })),
    ).toBe(false)
  })

  it('returns false when city is missing', () => {
    expect(isOnboardingComplete(makeUser({ city: null }))).toBe(false)
  })

  it('returns false when province is missing', () => {
    expect(isOnboardingComplete(makeUser({ province: null }))).toBe(false)
  })

  it('returns false when city is empty string', () => {
    expect(isOnboardingComplete(makeUser({ city: '' }))).toBe(false)
  })

  it('returns true for usernames with underscores that are not auto-generated', () => {
    expect(isOnboardingComplete(makeUser({ username: 'my_cool_name' }))).toBe(
      true,
    )
  })
})
