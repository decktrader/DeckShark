-- M3: Decks, deck_cards, and deck_photos tables

create table public.decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  commander_name text,
  commander_scryfall_id text,
  format text not null default 'commander',
  description text,
  estimated_value_cents integer,
  condition_notes text,
  status text not null default 'active' check (status in ('active', 'in_trade', 'traded', 'unlisted')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index decks_user_id_idx on public.decks (user_id);
create index decks_status_idx on public.decks (status);

alter table public.decks enable row level security;

create policy "Anyone can read active decks"
  on public.decks for select
  using (status = 'active' or auth.uid() = user_id);

create policy "Users can insert own decks"
  on public.decks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own decks"
  on public.decks for update
  using (auth.uid() = user_id);

create policy "Users can delete own decks"
  on public.decks for delete
  using (auth.uid() = user_id);

create trigger decks_updated_at
  before update on public.decks
  for each row execute function public.update_updated_at();

-- Deck cards

create table public.deck_cards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  card_name text not null,
  scryfall_id text,
  quantity integer not null default 1,
  is_commander boolean not null default false,
  price_cents integer
);

create index deck_cards_deck_id_idx on public.deck_cards (deck_id);

alter table public.deck_cards enable row level security;

create policy "Anyone can read deck cards for visible decks"
  on public.deck_cards for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and (decks.status = 'active' or auth.uid() = decks.user_id)
    )
  );

create policy "Users can insert cards to own decks"
  on public.deck_cards for insert
  with check (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and auth.uid() = decks.user_id
    )
  );

create policy "Users can update cards in own decks"
  on public.deck_cards for update
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and auth.uid() = decks.user_id
    )
  );

create policy "Users can delete cards from own decks"
  on public.deck_cards for delete
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and auth.uid() = decks.user_id
    )
  );

-- Deck photos

create table public.deck_photos (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  storage_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz default now() not null
);

create index deck_photos_deck_id_idx on public.deck_photos (deck_id);

alter table public.deck_photos enable row level security;

create policy "Anyone can read photos for visible decks"
  on public.deck_photos for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_photos.deck_id
        and (decks.status = 'active' or auth.uid() = decks.user_id)
    )
  );

create policy "Users can insert photos to own decks"
  on public.deck_photos for insert
  with check (
    exists (
      select 1 from public.decks
      where decks.id = deck_photos.deck_id
        and auth.uid() = decks.user_id
    )
  );

create policy "Users can delete photos from own decks"
  on public.deck_photos for delete
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_photos.deck_id
        and auth.uid() = decks.user_id
    )
  );

-- Storage bucket for deck photos
insert into storage.buckets (id, name, public)
values ('deck-photos', 'deck-photos', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Anyone can read deck photos"
  on storage.objects for select
  using (bucket_id = 'deck-photos');

create policy "Authenticated users can upload deck photos"
  on storage.objects for insert
  with check (bucket_id = 'deck-photos' and auth.role() = 'authenticated');

create policy "Users can delete own deck photos"
  on storage.objects for delete
  using (bucket_id = 'deck-photos' and auth.uid()::text = (storage.foldername(name))[1]);
