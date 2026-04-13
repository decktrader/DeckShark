-- M24: Email Polish — nudge tracking + email opt-in
-- Adds columns for re-engagement cron and unsubscribe support

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_updates_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_nudge_sent_at timestamptz;

-- RLS: users can update their own email_updates_opt_in (already covered by existing row-level policy)
-- Service role updates last_nudge_sent_at from cron (bypasses RLS)

-- RPC: find users eligible for re-engagement nudge
CREATE OR REPLACE FUNCTION get_inactive_users_for_nudge(batch_limit int DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  email text,
  username text,
  city text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    u.id AS user_id,
    au.email,
    u.username,
    u.city
  FROM users u
  JOIN auth.users au ON au.id = u.id
  WHERE u.email_updates_opt_in = true
    -- Not nudged in the last 7 days
    AND (u.last_nudge_sent_at IS NULL OR u.last_nudge_sent_at < now() - interval '7 days')
    -- Inactive: no recent login, deck creation, or trade activity in 14 days
    AND au.last_sign_in_at < now() - interval '14 days'
    AND NOT EXISTS (
      SELECT 1 FROM decks d
      WHERE d.user_id = u.id
        AND d.created_at > now() - interval '14 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM trades t
      WHERE (t.proposer_id = u.id OR t.receiver_id = u.id)
        AND t.updated_at > now() - interval '14 days'
    )
  ORDER BY au.last_sign_in_at ASC
  LIMIT batch_limit;
$$;
