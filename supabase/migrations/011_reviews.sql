-- M6: Reviews & Reputation
-- One review per participant per trade; triggers maintain users.trade_rating

create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  trade_id uuid references public.trades(id) on delete cascade not null,
  reviewer_id uuid references public.users(id) on delete cascade not null,
  reviewee_id uuid references public.users(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now() not null,
  -- One review per reviewer per trade
  unique (trade_id, reviewer_id)
);

create index reviews_reviewee_id_idx on public.reviews (reviewee_id);
create index reviews_trade_id_idx on public.reviews (trade_id);

alter table public.reviews enable row level security;

create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- Recalculate trade_rating on the reviewee whenever a review is inserted
create or replace function public.handle_review_created()
returns trigger as $$
begin
  update public.users
  set
    trade_rating = (
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where reviewee_id = new.reviewee_id
    ),
    updated_at = now()
  where id = new.reviewee_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute function public.handle_review_created();

-- Increment completed_trades for both participants when a trade is completed
-- (extends the function from migration 009)
create or replace function public.handle_trade_completed()
returns trigger as $$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    -- Transfer proposer's decks to receiver
    update public.decks
    set
      user_id = new.receiver_id,
      available_for_trade = false,
      status = 'active',
      updated_at = now()
    where id in (
      select deck_id from public.trade_decks
      where trade_id = new.id and offered_by = new.proposer_id
    );

    -- Transfer receiver's decks to proposer
    update public.decks
    set
      user_id = new.proposer_id,
      available_for_trade = false,
      status = 'active',
      updated_at = now()
    where id in (
      select deck_id from public.trade_decks
      where trade_id = new.id and offered_by = new.receiver_id
    );

    -- Increment completed_trades for both participants
    update public.users
    set completed_trades = completed_trades + 1, updated_at = now()
    where id in (new.proposer_id, new.receiver_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;
