-- M22: Notification System
-- Centralized in-app notifications replacing scattered badge counts.

-- ── Notifications table ──────────────────────────────────
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'trade_proposed', 'trade_countered', 'trade_accepted',
    'trade_declined', 'trade_completed',
    'want_list_match', 'review_received', 'interest_threshold'
  )),
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── RLS ──────────────────────────────────────────────────
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, read)
  WHERE read = false;

CREATE INDEX idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

-- ── Expand notification preferences ──────────────────────
-- Add new preference keys with defaults (existing trade_updates
-- and want_list_matches are preserved).
UPDATE users
SET notification_preferences = notification_preferences
  || '{"review_received": true, "interest_threshold": true}'::jsonb
WHERE NOT notification_preferences ? 'review_received';
