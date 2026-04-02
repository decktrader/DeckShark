-- Add collector_number and set_name to card_cache for printing-accurate pricing
-- Every Scryfall card has a unique (set_code, collector_number) pair

alter table public.card_cache
  add column if not exists collector_number text,
  add column if not exists set_name text;

-- Composite index for exact printing lookups: (set_code, collector_number)
create index if not exists card_cache_set_collector_idx
  on public.card_cache (set_code, collector_number);

-- Index for name + set fallback queries
create index if not exists card_cache_name_set_idx
  on public.card_cache (name, set_code);
