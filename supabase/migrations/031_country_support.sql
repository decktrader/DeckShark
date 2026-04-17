-- Add country column to users table (default 'CA' for existing users)
alter table public.users
  add column if not exists country text default 'CA';

-- Backfill all existing users to Canada
update public.users set country = 'CA' where country is null;

-- Add check constraint for supported countries
alter table public.users
  add constraint users_country_check check (country in ('CA', 'US'));
