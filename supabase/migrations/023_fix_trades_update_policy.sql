-- Fix "more than one row returned by a subquery" bug in trades update policy.
-- The WITH CHECK subquery `FROM trades WHERE id = trades.id` was ambiguous —
-- Postgres aliased the subquery table, making it self-referencing (always true),
-- which returned all rows. Fix: use OLD-style comparison via a BEFORE trigger
-- that prevents changing proposer_id and receiver_id directly.

-- Drop the broken policy
DROP POLICY IF EXISTS "Participants can update their trades" ON public.trades;

-- Replace with a simple policy (no subquery needed)
CREATE POLICY "Participants can update their trades"
  ON public.trades FOR UPDATE
  USING (auth.uid() = proposer_id OR auth.uid() = receiver_id);

-- Use a trigger to enforce immutable columns instead of RLS WITH CHECK
CREATE OR REPLACE FUNCTION public.prevent_trade_id_change()
  RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.proposer_id <> OLD.proposer_id THEN
    RAISE EXCEPTION 'Cannot change proposer_id';
  END IF;
  IF NEW.receiver_id <> OLD.receiver_id THEN
    RAISE EXCEPTION 'Cannot change receiver_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trades_prevent_id_change
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_trade_id_change();
