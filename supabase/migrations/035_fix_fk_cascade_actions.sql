-- Fix FK constraints that use NO ACTION (default) and would block user deletion.
-- These columns reference users who may be deleted (admins, counter-offer senders).
-- The record itself should survive — just null out the reference.

-- trades.last_counter_by → SET NULL
ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_last_counter_by_fkey,
  ADD CONSTRAINT trades_last_counter_by_fkey
    FOREIGN KEY (last_counter_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- reports.resolved_by → SET NULL
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_resolved_by_fkey,
  ADD CONSTRAINT reports_resolved_by_fkey
    FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- user_suspensions.suspended_by → SET NULL (make nullable first)
ALTER TABLE public.user_suspensions
  ALTER COLUMN suspended_by DROP NOT NULL;

ALTER TABLE public.user_suspensions
  DROP CONSTRAINT IF EXISTS user_suspensions_suspended_by_fkey,
  ADD CONSTRAINT user_suspensions_suspended_by_fkey
    FOREIGN KEY (suspended_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- user_suspensions.lifted_by → SET NULL
ALTER TABLE public.user_suspensions
  DROP CONSTRAINT IF EXISTS user_suspensions_lifted_by_fkey,
  ADD CONSTRAINT user_suspensions_lifted_by_fkey
    FOREIGN KEY (lifted_by) REFERENCES public.users(id) ON DELETE SET NULL;
