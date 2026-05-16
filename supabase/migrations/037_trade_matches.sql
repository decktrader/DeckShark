-- Smart trade matching and deck value portfolio tracking

-- 1. Trade match suggestions
create table public.trade_matches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  user_deck_id uuid references public.decks(id) on delete cascade not null,
  matched_deck_id uuid references public.decks(id) on delete cascade not null,
  matched_user_id uuid references public.users(id) on delete cascade not null,
  match_score integer not null default 0, -- 0-100, higher = better match
  value_diff_cents integer not null default 0, -- absolute value difference
  status text not null default 'active' check (status in ('active', 'dismissed', 'traded')),
  created_at timestamptz default now() not null,
  unique (user_deck_id, matched_deck_id)
);

alter table public.trade_matches enable row level security;

create policy "Users can read own matches"
  on public.trade_matches for select
  using (auth.uid() = user_id);

create policy "Users can update own matches"
  on public.trade_matches for update
  using (auth.uid() = user_id);

create index idx_trade_matches_user on public.trade_matches(user_id, status);
create index idx_trade_matches_deck on public.trade_matches(user_deck_id);

-- 2. Deck value snapshots for portfolio tracking
create table public.deck_value_snapshots (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  value_cents integer not null,
  snapped_at timestamptz default now() not null
);

alter table public.deck_value_snapshots enable row level security;

create policy "Users can read own deck snapshots"
  on public.deck_value_snapshots for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_value_snapshots.deck_id
      and decks.user_id = auth.uid()
    )
  );

create index idx_deck_value_snapshots_deck on public.deck_value_snapshots(deck_id, snapped_at desc);

-- 3. Add trade_match to notification type CHECK constraint
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'trade_proposed', 'trade_countered', 'trade_accepted',
    'trade_declined', 'trade_completed',
    'want_list_match', 'review_received', 'interest_threshold',
    'trade_match'
  ));

-- 4. Add previous_value_cents to decks for tracking value changes
alter table public.decks add column if not exists previous_value_cents integer;
