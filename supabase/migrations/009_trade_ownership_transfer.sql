-- Extend trade completion: transfer deck ownership between participants
-- Replaces the trigger function from 008

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
  end if;
  return new;
end;
$$ language plpgsql security definer;
