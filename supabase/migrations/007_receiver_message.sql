-- Add receiver_message to trades so the receiver can reply without changing status

alter table public.trades add column receiver_message text;
