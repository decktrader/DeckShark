-- M7: Want Lists — users describe what they're looking for

create table public.want_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  format text,
  commander_name text,
  color_identity text[],
  min_value_cents integer,
  max_value_cents integer,
  description text,
  status text not null default 'active' check (status in ('active', 'fulfilled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index want_lists_user_id_idx on public.want_lists (user_id);
create index want_lists_status_idx on public.want_lists (status);

alter table public.want_lists enable row level security;

create policy "Anyone can read active want lists"
  on public.want_lists for select
  using (status = 'active' or auth.uid() = user_id);

create policy "Users can insert own want lists"
  on public.want_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own want lists"
  on public.want_lists for update
  using (auth.uid() = user_id);

create policy "Users can delete own want lists"
  on public.want_lists for delete
  using (auth.uid() = user_id);

create trigger want_lists_updated_at
  before update on public.want_lists
  for each row execute function public.update_updated_at();
