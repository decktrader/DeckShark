-- Allow trade participants to read decks that are/were part of their trades,
-- even after ownership has transferred or status is no longer 'active'

create policy "Trade participants can read trade decks"
  on public.decks for select
  using (
    exists (
      select 1 from public.trade_decks td
      join public.trades t on t.id = td.trade_id
      where td.deck_id = decks.id
        and (auth.uid() = t.proposer_id or auth.uid() = t.receiver_id)
    )
  );
