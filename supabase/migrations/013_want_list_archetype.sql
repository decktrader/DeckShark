-- Add archetype field to want_lists for deck strategy filtering

alter table public.want_lists add column archetype text;
