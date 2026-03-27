-- M4: Add available_for_trade flag to decks and update RLS policies

alter table public.decks
  add column available_for_trade boolean not null default false;

create index decks_available_for_trade_idx on public.decks (available_for_trade)
  where available_for_trade = true;

-- Update decks RLS: public can only see available decks, owners see all their own
drop policy "Anyone can read active decks" on public.decks;

create policy "Anyone can read available or own decks"
  on public.decks for select
  using (available_for_trade = true or auth.uid() = user_id);

-- Update deck_cards RLS to match
drop policy "Anyone can read deck cards for visible decks" on public.deck_cards;

create policy "Anyone can read deck cards for visible decks"
  on public.deck_cards for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and (decks.available_for_trade = true or auth.uid() = decks.user_id)
    )
  );

-- Update deck_photos RLS to match
drop policy "Anyone can read photos for visible decks" on public.deck_photos;

create policy "Anyone can read photos for visible decks"
  on public.deck_photos for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_photos.deck_id
        and (decks.available_for_trade = true or auth.uid() = decks.user_id)
    )
  );
