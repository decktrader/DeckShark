# DeckShark — Backlog

<!-- Newest entries at the top. Check items off as they're completed. -->

### 2026-06-29 — Redesign follow-ups (Convention Floor)

- [ ] Build a separate **Watch / favourite** feature (bookmark a deck to find it later). Net-new backend: table + RLS + service + toggle. This is distinct from the existing shipping-vote (`deck_interests`), which stays as a vote for the shipping feature. The redesign Deck Detail mock's "Watch this deck" heart button represents this future feature; for now the sidebar shows the shipping-vote (non-local viewers only) instead. Consider whether Watch should be visible to all viewers including local.

- [ ] Want Lists directory: build the mock's "Most wanted right now" aggregate strip (ranked demand chips) and the search/format/colors/budget/sort toolbar. All need new aggregate + filter params on `getPublicWantLists` (data layer), so they were omitted from the presentation reskin. "N seeking similar" on cards needs the same aggregate.
- [ ] Home "Active Traders" section: needs a traders-directory query (recent active deck owners + what they want). Omitted from the Home rebuild since no such service exists yet; the Community page will likely share it.
- [ ] Home momentum tiles: the mock's bespoke tile (face-stack of who wants it + "N want it") was approximated with the standard DeckCard. Build the dedicated tile if desired (needs "who is interested" data).
- [ ] Browse Decks list view: build a true list-row deck layout. Currently `/decks?view=list` reuses the grid `DeckCard` in a 1–2 column layout because the redesign mock only specifies the grid tile. (See `src/components/ds/deck-card.tsx`, `src/app/(public)/decks/page.tsx`.)
- [ ] Browse Decks color-identity filter: optionally convert the dropdown selector to the mock's clickable mana-pip row (`.cidsel`). Kept the existing `ColorIdentitySelector` dropdown for now to preserve behavior.

### 2026-05-15 — M27a Launch Readiness: manual tasks

- [ ] Upgrade Vercel to Pro ($20/mo) — 1TB bandwidth, 1M function invocations, spend protection
- [ ] Upgrade Supabase to Pro ($25/mo) — 8GB DB, 100K auth users, dedicated connection pooling, daily backups
- [ ] Upgrade Resend to paid tier ($20/mo) — 50K emails/month (free tier caps at 100/day)
- [ ] Upgrade Upstash to Pay-as-you-go — free tier caps at 500K commands/month
- [ ] Enable Supabase connection pooler (pgBouncer) in Supabase dashboard → Settings → Database
- [ ] Set spend alerts on Vercel (Settings → Billing → Spend Management)
- [ ] Set spend alerts on Supabase (Settings → Billing → Cost Control)
- [ ] Apply migrations 033-035 to production Supabase
- [ ] Run load test with `hey` or `k6` against key endpoints (homepage, /decks, /decks/[id], /api/cards/search) — target 100 concurrent users under 2s response

### 2026-05-15 — Beta testing follow-ups

- [ ] Build `/beta-test` command/skill that runs common user flows (trade lifecycle, account deletion, reviews, cron endpoints) and reports errors
- [ ] Add UI for terminal trade states (completed/declined/cancelled show blank — should show status message + review prompt or "start new trade" link)
- [ ] Power user hero (state D): fall back to recent trade activity when notification inbox is empty (currently shows "No recent activity")
- [ ] Graceful error handling on `/api/cron/sync-cards` (currently 500s on Scryfall timeout)

### 2026-04-17 — Future settings enhancements

- [ ] Appearance tab — dark/light/system theme toggle (requires building light theme)
- [ ] Default browse view preference (grid/list) stored in user profile
- [ ] Two-factor authentication (TOTP)
- [ ] Blocked users list and management
- [ ] Trade preferences (preferred formats, min trade value, trade radius)
- [ ] Push notification preferences (when PWA push is implemented)

### 2026-04-12 — M19 Admin Portal deferred phases

- [ ] Rate limit dashboard — show top rate-limited IPs/users, hit counts by endpoint (requires Upstash logging)
- [ ] Sentry integration in admin — embed error feed or lightweight error summary by route
- [ ] Storage usage — deck-photos bucket size and growth (Supabase Storage API)
- [ ] Deck photo moderation — thumbnail grid of recently uploaded photos for quick review
- [ ] Email preferences overview — opt-in/opt-out counts, useful before re-engagement campaigns
- [ ] Quick user lookup by email in admin users page (currently only username/city search)
- [ ] Outlier detection trigger — flag lopsided trades for admin review
- [ ] Review spam detection — flag reviews from accounts with no completed trades
- [ ] Audit log — track all admin actions (suspend, flag, edit) with admin_user_id, timestamp, details

### 2026-04-12 — Admin growth chart cleanup

- [x] Delete unused `src/components/admin/growth-metrics.tsx` (replaced by growth-charts.tsx) — already deleted
- [x] Remove unused `getGrowthData` function from admin.server.ts (replaced by getGrowthChartData)
