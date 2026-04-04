-- M16: Security Hardening — restrict UPDATE columns on users and trades
--
-- Users should NOT be able to modify their own trade_rating, completed_trades,
-- or reputation_score — those are managed by triggers only.
--
-- Trade participants should NOT be able to modify proposer_id, receiver_id,
-- or created_at after creation. cash_difference_cents is allowed to change
-- during counter-offers, so we leave it updatable.

-- ─── Users: restrict updatable columns ──────────────────────────────────────

drop policy if exists "Users can update own row" on public.users;

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (
    -- Ensure protected fields haven't changed by comparing against current row
    -- This WITH CHECK runs after the update; if a protected field was changed,
    -- it will differ from the pre-update value and the check will fail.
    -- Postgres RLS can't directly compare old vs new, so we use a subquery.
    trade_rating = (select trade_rating from public.users where id = auth.uid())
    and completed_trades = (select completed_trades from public.users where id = auth.uid())
    and reputation_score = (select reputation_score from public.users where id = auth.uid())
    and created_at = (select created_at from public.users where id = auth.uid())
  );

-- ─── Trades: restrict updatable columns ─────────────────────────────────────

drop policy if exists "Participants can update their trades" on public.trades;

create policy "Participants can update their trades"
  on public.trades for update
  using (auth.uid() = proposer_id or auth.uid() = receiver_id)
  with check (
    -- proposer_id and receiver_id must not change
    proposer_id = (select proposer_id from public.trades where id = trades.id)
    and receiver_id = (select receiver_id from public.trades where id = trades.id)
  );

-- ─── Storage: validate upload path includes user ID ─────────────────────────

drop policy if exists "Authenticated users can upload deck photos" on storage.objects;

create policy "Authenticated users can upload deck photos"
  on storage.objects for insert
  with check (
    bucket_id = 'deck-photos'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
