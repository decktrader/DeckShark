-- Enforce valid trade status transitions at the DB level.
-- Terminal states (completed, declined, cancelled) cannot transition to anything.
-- This is a safety net — the service layer also validates transitions.

CREATE OR REPLACE FUNCTION check_trade_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if status is actually changing
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Define valid transitions
  CASE OLD.status
    WHEN 'proposed' THEN
      IF NEW.status NOT IN ('accepted', 'declined', 'countered', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid trade transition: % → %', OLD.status, NEW.status;
      END IF;
    WHEN 'countered' THEN
      IF NEW.status NOT IN ('accepted', 'declined', 'countered', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid trade transition: % → %', OLD.status, NEW.status;
      END IF;
    WHEN 'accepted' THEN
      IF NEW.status NOT IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid trade transition: % → %', OLD.status, NEW.status;
      END IF;
    WHEN 'completed', 'declined', 'cancelled', 'disputed' THEN
      RAISE EXCEPTION 'Cannot change trade from terminal status: %', OLD.status;
    ELSE
      RAISE EXCEPTION 'Unknown trade status: %', OLD.status;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_trade_status_transition
  BEFORE UPDATE OF status ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION check_trade_status_transition();
