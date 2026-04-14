-- M21: Remote Interest Signal — "I'd trade for this"
-- Captures demand from users who would trade for a deck if shipping were available.

-- ── Table ────────────────────────────────────────────────
CREATE TABLE deck_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, deck_id)
);

ALTER TABLE deck_interests ENABLE ROW LEVEL SECURITY;

-- ── RLS ──────────────────────────────────────────────────
CREATE POLICY "Users can express interest"
  ON deck_interests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can withdraw interest"
  ON deck_interests FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read interests"
  ON deck_interests FOR SELECT TO authenticated, anon
  USING (true);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX idx_deck_interests_deck ON deck_interests(deck_id);
CREATE INDEX idx_deck_interests_user ON deck_interests(user_id);

-- ── Track which notification thresholds have been sent ───
ALTER TABLE decks ADD COLUMN interest_thresholds_notified integer[] DEFAULT '{}';
