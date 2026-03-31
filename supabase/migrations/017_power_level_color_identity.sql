-- Add power_level and color_identity to decks

alter table decks
  add column if not exists power_level text
    check (power_level in ('casual', 'precon', 'mid', 'high', 'cedh')),
  add column if not exists color_identity text[] not null default '{}';

create index if not exists decks_power_level_idx
  on decks (power_level)
  where power_level is not null;
