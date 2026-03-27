-- Add notification preferences column to users
-- Defaults both trade_updates and want_list_matches to true for all users
alter table public.users
  add column notification_preferences jsonb not null
  default '{"trade_updates": true, "want_list_matches": true}'::jsonb;
