-- When a trade is completed, mark all involved decks as unavailable for trade

create or replace function public.handle_trade_completed()
returns trigger as $$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    update public.decks
    set
      available_for_trade = false,
      status = 'traded',
      updated_at = now()
    where id in (
      select deck_id from public.trade_decks where trade_id = new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_trade_completed
  after update on public.trades
  for each row execute function public.handle_trade_completed();
