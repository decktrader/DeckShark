-- M13: Counter-offers — track whose turn it is to act
-- When a trade is countered, last_counter_by records who sent the counter.
-- The OTHER party is the one who can accept/decline/counter next.

alter table public.trades
  add column if not exists last_counter_by uuid references public.users(id);

-- Relax trade_decks INSERT policy: any trade participant can insert deck rows
-- (needed for counter-offers where user A specifies which of user B's decks they want).
-- The original policy required auth.uid() = offered_by, which blocks counter-offers.
drop policy if exists "Participants can insert trade decks" on public.trade_decks;

create policy "Participants can insert trade decks"
  on public.trade_decks for insert
  with check (
    exists (
      select 1 from public.trades
      where trades.id = trade_decks.trade_id
        and (auth.uid() = trades.proposer_id or auth.uid() = trades.receiver_id)
    )
  );
