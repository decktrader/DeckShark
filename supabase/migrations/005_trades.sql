-- M5: Trades — proposal, negotiation, and completion

create table public.trades (
  id uuid default gen_random_uuid() primary key,
  proposer_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  status text not null default 'proposed' check (
    status in ('proposed', 'accepted', 'declined', 'countered', 'completed', 'cancelled', 'disputed')
  ),
  -- Positive = proposer pays receiver, negative = receiver pays proposer
  cash_difference_cents integer not null default 0,
  message text,
  -- PIPEDA: contact info only shared after both parties consent on acceptance
  proposer_contact_shared boolean not null default false,
  receiver_contact_shared boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint no_self_trade check (proposer_id <> receiver_id)
);

create index trades_proposer_id_idx on public.trades (proposer_id);
create index trades_receiver_id_idx on public.trades (receiver_id);
create index trades_status_idx on public.trades (status);

alter table public.trades enable row level security;

-- Only participants can see their own trades
create policy "Participants can read their trades"
  on public.trades for select
  using (auth.uid() = proposer_id or auth.uid() = receiver_id);

create policy "Authenticated users can propose trades"
  on public.trades for insert
  with check (auth.uid() = proposer_id);

-- Only participants can update (accept, decline, counter, complete, cancel)
create policy "Participants can update their trades"
  on public.trades for update
  using (auth.uid() = proposer_id or auth.uid() = receiver_id);

create trigger trades_updated_at
  before update on public.trades
  for each row execute function public.update_updated_at();

-- Which decks are on the table, and from which user
create table public.trade_decks (
  id uuid default gen_random_uuid() primary key,
  trade_id uuid references public.trades(id) on delete cascade not null,
  deck_id uuid references public.decks(id) on delete cascade not null,
  offered_by uuid references public.users(id) on delete cascade not null
);

create index trade_decks_trade_id_idx on public.trade_decks (trade_id);
create index trade_decks_deck_id_idx on public.trade_decks (deck_id);

alter table public.trade_decks enable row level security;

create policy "Participants can read trade decks"
  on public.trade_decks for select
  using (
    exists (
      select 1 from public.trades
      where trades.id = trade_decks.trade_id
        and (auth.uid() = trades.proposer_id or auth.uid() = trades.receiver_id)
    )
  );

create policy "Participants can insert trade decks"
  on public.trade_decks for insert
  with check (
    auth.uid() = offered_by
    and exists (
      select 1 from public.trades
      where trades.id = trade_decks.trade_id
        and (auth.uid() = trades.proposer_id or auth.uid() = trades.receiver_id)
    )
  );

create policy "Participants can delete trade decks"
  on public.trade_decks for delete
  using (
    exists (
      select 1 from public.trades
      where trades.id = trade_decks.trade_id
        and (auth.uid() = trades.proposer_id or auth.uid() = trades.receiver_id)
    )
  );
