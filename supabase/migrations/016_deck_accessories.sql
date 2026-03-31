-- Add sleeve and deckbox inclusion flags to decks
-- Displayed on browse cards and deck detail pages to inform trade partners

alter table public.decks
  add column includes_sleeves boolean not null default false,
  add column includes_deckbox boolean not null default false;
