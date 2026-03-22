-- M2: Card cache table for Scryfall data

-- Enable trigram extension for fuzzy name search
create extension if not exists pg_trgm;

create table public.card_cache (
  scryfall_id text primary key,
  oracle_id text,
  name text not null,
  mana_cost text,
  type_line text,
  color_identity text[] default '{}' not null,
  set_code text,
  image_uri_normal text,
  image_uri_small text,
  image_uri_art_crop text,
  price_usd_cents integer,
  price_usd_foil_cents integer,
  legalities jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trigram index for fast name search
create index card_cache_name_trgm_idx on public.card_cache using gin (name gin_trgm_ops);

-- Index for oracle_id lookups (grouping printings)
create index card_cache_oracle_id_idx on public.card_cache (oracle_id);

-- RLS: public read only
alter table public.card_cache enable row level security;

create policy "Anyone can read cards"
  on public.card_cache for select
  using (true);

-- updated_at trigger (reuse function from 001)
create trigger card_cache_updated_at
  before update on public.card_cache
  for each row execute function public.update_updated_at();
