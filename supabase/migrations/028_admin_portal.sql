-- M19: Admin Portal — is_admin flag, reports, feedback, user_suspensions

-- Add is_admin flag to users (only settable via service role)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Block public writes to is_admin via RLS
-- The existing users UPDATE policy uses set_config columns; add is_admin to the restricted list
CREATE OR REPLACE FUNCTION check_user_update_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from modifying protected columns
  IF NEW.trade_rating IS DISTINCT FROM OLD.trade_rating THEN
    RAISE EXCEPTION 'Cannot modify trade_rating directly';
  END IF;
  IF NEW.completed_trades IS DISTINCT FROM OLD.completed_trades THEN
    RAISE EXCEPTION 'Cannot modify completed_trades directly';
  END IF;
  IF NEW.reputation_score IS DISTINCT FROM OLD.reputation_score THEN
    RAISE EXCEPTION 'Cannot modify reputation_score directly';
  END IF;
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'Cannot modify is_admin directly';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to pick up the new function body
DROP TRIGGER IF EXISTS check_user_update_columns_trigger ON users;
CREATE TRIGGER check_user_update_columns_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_user_update_columns();

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('user', 'deck', 'trade')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- RLS for reports: reporters can insert + read own, admins read/update all
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can read own reports"
  ON reports FOR SELECT TO authenticated
  USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('bug', 'feature', 'general')),
  message text NOT NULL,
  page_url text,
  page_route text,
  user_agent text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'archived')),
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (even anonymous via anon key)
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can read feedback"
  ON feedback FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update feedback"
  ON feedback FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- User suspensions table
CREATE TABLE IF NOT EXISTS user_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  suspended_by uuid NOT NULL REFERENCES users(id),
  suspended_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- null = permanent
  lifted_at timestamptz,
  lifted_by uuid REFERENCES users(id)
);

ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage suspensions"
  ON user_suspensions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Users can read their own suspensions (to see why they're suspended)
CREATE POLICY "Users can read own suspensions"
  ON user_suspensions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_suspensions_user ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_suspensions_active ON user_suspensions(user_id, expires_at)
  WHERE lifted_at IS NULL;

-- Admin stats RPC: get platform overview counts in a single query
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json AS $$
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM users),
    'total_decks', (SELECT count(*) FROM decks WHERE status = 'active'),
    'active_trades', (SELECT count(*) FROM trades WHERE status IN ('proposed', 'accepted', 'countered')),
    'completed_trades', (SELECT count(*) FROM trades WHERE status = 'completed'),
    'total_want_lists', (SELECT count(*) FROM want_lists WHERE status = 'active'),
    'total_trade_value_cents', (SELECT coalesce(sum(d.estimated_value_cents), 0) FROM trade_decks td JOIN decks d ON d.id = td.deck_id JOIN trades t ON t.id = td.trade_id WHERE t.status = 'completed'),
    'open_reports', (SELECT count(*) FROM reports WHERE status = 'open'),
    'new_feedback', (SELECT count(*) FROM feedback WHERE status = 'new')
  );
$$ LANGUAGE sql SECURITY DEFINER;
