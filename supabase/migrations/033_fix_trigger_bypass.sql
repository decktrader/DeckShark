-- Fix: internal triggers (handle_trade_completed, handle_review_created) were
-- blocked by check_user_update_columns_trigger when trying to update protected
-- columns (completed_trades, trade_rating). Use a session GUC flag so internal
-- SECURITY DEFINER triggers can bypass the column protection check.

-- Update the guard trigger to respect the internal_update flag
CREATE OR REPLACE FUNCTION check_user_update_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip checks when called from internal triggers (they set this flag)
  IF coalesce(current_setting('app.internal_update', true), '') = 'true' THEN
    RETURN NEW;
  END IF;

  -- Prevent regular users from modifying protected columns
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

-- Update handle_trade_completed to set the bypass flag
CREATE OR REPLACE FUNCTION public.handle_trade_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF new.status = 'completed' AND old.status <> 'completed' THEN
    PERFORM set_config('app.internal_update', 'true', true);

    -- Transfer proposer's decks to receiver
    UPDATE public.decks
    SET user_id = new.receiver_id, available_for_trade = false, status = 'active', updated_at = now()
    WHERE id IN (SELECT deck_id FROM public.trade_decks WHERE trade_id = new.id AND offered_by = new.proposer_id);

    -- Transfer receiver's decks to proposer
    UPDATE public.decks
    SET user_id = new.proposer_id, available_for_trade = false, status = 'active', updated_at = now()
    WHERE id IN (SELECT deck_id FROM public.trade_decks WHERE trade_id = new.id AND offered_by = new.receiver_id);

    -- Increment completed_trades for both participants
    UPDATE public.users
    SET completed_trades = completed_trades + 1, updated_at = now()
    WHERE id IN (new.proposer_id, new.receiver_id);

    PERFORM set_config('app.internal_update', 'false', true);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_review_created to set the bypass flag
CREATE OR REPLACE FUNCTION public.handle_review_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.internal_update', 'true', true);

  UPDATE public.users
  SET trade_rating = (
    SELECT round(avg(rating)::numeric, 2)
    FROM public.reviews
    WHERE reviewee_id = new.reviewee_id
  ), updated_at = now()
  WHERE id = new.reviewee_id;

  PERFORM set_config('app.internal_update', 'false', true);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
