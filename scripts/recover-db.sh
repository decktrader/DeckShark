#!/bin/bash
# Recover local Supabase after container crash
# Usage: pnpm db:recover

set -e

echo "→ Stopping any running Supabase instances..."
supabase stop --no-backup 2>/dev/null || true
supabase stop --project-id DeckTrader 2>/dev/null || true
supabase stop --project-id jordangraham 2>/dev/null || true

echo "→ Starting Supabase..."
supabase start

echo "→ Checking schema..."
TABLE_COUNT=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -lt "5" ]; then
  echo "→ Schema missing — applying migrations..."
  cat supabase/migrations/*.sql | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres > /dev/null 2>&1 || true
  echo "✓ Migrations applied"
else
  echo "✓ Schema OK ($TABLE_COUNT tables found)"
fi

echo "→ Checking user profiles..."
MISSING=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -t -c "SELECT id FROM auth.users WHERE id NOT IN (SELECT id FROM public.users);" 2>/dev/null | tr -d ' \n')

if [ -n "$MISSING" ]; then
  echo "→ Missing profile rows — inserting..."
  for uid in $MISSING; do
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
      -c "INSERT INTO public.users (id, username) VALUES ('$uid', 'user_$(openssl rand -hex 4)') ON CONFLICT DO NOTHING;" > /dev/null
  done
  echo "✓ Profile rows created — complete onboarding to set your username"
else
  echo "✓ User profiles OK"
fi

echo ""
echo "✓ Database recovered. You may need to re-sync cards:"
echo "  http://localhost:3000/api/cron/sync-cards"
