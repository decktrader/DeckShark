-- Fix trade_decks insert policy: proposer needs to insert receiver's deck rows too.
-- The old policy blocked any row where offered_by != auth.uid(), but the proposer
-- legitimately creates rows for both sides of the trade at proposal time.

drop policy "Participants can insert trade decks" on public.trade_decks;

create policy "Participants can insert trade decks"
  on public.trade_decks for insert
  with check (
    exists (
      select 1 from public.trades
      where trades.id = trade_decks.trade_id
        and (auth.uid() = trades.proposer_id or auth.uid() = trades.receiver_id)
    )
  );
