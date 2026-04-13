-- M18: Performance indexes for browse queries

-- Composite index for the main browse query (available + active decks)
CREATE INDEX IF NOT EXISTS idx_decks_browse
  ON decks(available_for_trade, status, updated_at DESC)
  WHERE available_for_trade = true AND status = 'active';

-- Index for value-based sorting/filtering
CREATE INDEX IF NOT EXISTS idx_decks_value
  ON decks(estimated_value_cents)
  WHERE available_for_trade = true AND status = 'active';

-- Index on want_lists for public browse
CREATE INDEX IF NOT EXISTS idx_want_lists_browse
  ON want_lists(status, created_at DESC)
  WHERE status = 'active';
