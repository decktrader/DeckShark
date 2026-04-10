# MTG Deck Exchange — Implementation Plan

## Context

We have a complete technical spec (SPEC.md) for a greenfield MTG deck trading marketplace. Two-person dev team, both using Claude Code. The strategy is "come for the tool, stay for the network" — build a useful deck manager first (Phase A), then layer trading on top (Phase B). This plan breaks the spec into deployable increments.

## Guiding Principles

1. **Deploy early, deploy often.** Every milestone ends with a working Vercel deployment.
2. **Phase A first.** Deck management provides standalone value — get it live before touching trading.
3. **Full-stack slices, not layers.** Each dev owns a feature end-to-end (DB + service + UI) to minimize merge conflicts.
4. **One migration owner at a time.** Migrations are sequential; coordinate who writes them per milestone.

---

## Milestone 0: Project Scaffolding (1 day)

**Goal:** Both devs can clone, run locally, and deploy a blank shell to Vercel.

- `pnpm create next-app` with App Router, TypeScript, Tailwind
- shadcn/ui initialization
- Supabase CLI init (`supabase/config.toml`, empty `migrations/`, `seed.sql`)
- CLAUDE.md with project conventions (service layer pattern, import rules, naming)
- `.env.example` with all required vars
- Basic `layout.tsx` + placeholder `page.tsx`
- Vercel project linked, auto-deploy from `main`
- GitHub Actions CI: lint + type-check on PR
- Supabase projects created (staging + production), env vars in Vercel
- `src/types/index.ts` — shared TypeScript types matching DB schema
- `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` — Supabase client setup
- Empty `src/lib/services/` stubs with type signatures

**Dev split:** Dev A → Next.js scaffolding, Tailwind, shadcn/ui, layout, CLAUDE.md. Dev B → Supabase setup, `.env.example`, CI, Vercel linking.

---

## Milestone 1: Auth & User Profiles (2-3 days)

**Goal:** Users can sign up, complete onboarding, and have a profile page.

**Migration `001_users.sql`:** `users` table with RLS (public read, own write). Trigger to auto-create user row on auth signup.

**Build:**

- Supabase Auth config (email only — Google OAuth moved to M9)
- `middleware.ts` protecting `/(protected)/*` routes
- Login + register pages (`/(auth)/`)
- Onboarding flow (`/(protected)/onboarding/`) — username, city, province
- Public profile page (`/(public)/profile/[username]/`)
- Settings page (`/(protected)/settings/`) — edit profile
- Privacy policy page (static, PIPEDA)
- Header with auth state
- `src/lib/services/auth.ts` + `src/lib/services/users.ts`

**Dev split:** Dev A → auth pages, middleware, auth service, header. Dev B → migration, onboarding, profile, settings, users service.

**Depends on:** M0

---

## Milestone 2: Card Data Infrastructure (2-3 days)

**Goal:** `card_cache` table populated with Scryfall bulk data. Card search works.

**Migration `002_card_cache.sql`:** `card_cache` table with trigram index on name, public read RLS.

**Build:**

- Scryfall bulk data sync cron route (`/api/cron/sync-cards/`)
- Vercel cron config for daily sync
- `src/lib/scryfall/api.ts` — wrapper for `/cards/autocomplete`, `/cards/search`, `/cards/collection`
- `src/lib/services/cards.ts` — `searchCards()`, `getCardByName()`, `getCardsByIds()`, `getCardPrice()`
- Card autocomplete component (`src/components/deck/card-autocomplete.tsx`)

**Dev split:** Dev A → Scryfall API wrapper, bulk sync cron. Dev B → migration, cards service, autocomplete component.

**Depends on:** M0. **Can run in parallel with M1.**

---

## Milestone 3: Deck Management — Phase A Core (5-7 days)

**Goal:** Users can create, import, view, and manage decks. This IS the Phase A product.

**Migration `003_decks.sql`:** `decks`, `deck_cards`, `deck_photos` tables with RLS.

**Build:**

- Dashboard (`/(protected)/dashboard/`) — grid of user's decks with value totals
- Create deck (`/(protected)/decks/new/`) — form + import tabs
- Edit deck (`/(protected)/decks/[id]/edit/`)
- `src/lib/services/decks.ts` — full CRUD + `calculateDeckValue()`
- Importer: `src/lib/importers/text.ts` (paste text — Moxfield/Archidekt URL importers deferred to M4)
- Deck display components: `deck-card-grid.tsx`, `deck-card-list.tsx`, `deck-stats.tsx`, `deck-header.tsx`
- Photo upload via Supabase Storage (`deck-photos` bucket)
- `src/lib/services/storage.ts`
- Auto-pricing from card_cache

**Dev split:** Dev A → deck CRUD (service + pages), dashboard, photo upload. Dev B → all importers, import UI, deck card components, pricing.

**Depends on:** M1 + M2

**Phase A is deployable after this milestone.**

---

## Milestone 4: Public Browsing (2-3 days)

**Goal:** Anyone can browse trade-available decks without logging in.

- Public browse page (`/(public)/decks/`) — deck grid with filters
- Public deck detail (`/(public)/decks/[id]/`) — full decklist, photos, owner snippet
- Filters: color identity, value range, city/province, format, commander search
- "Mark as available for trade" toggle on dashboard
- Enhanced public profile with trade-available decks
- URL importers: `src/lib/importers/moxfield.ts`, `archidekt.ts` (deferred from M3)

**Dev split:** Dev A → browse page with filters, deck grid. Dev B → deck detail page, owner profile snippet.

**Depends on:** M3

---

## Milestone 5: Trading — Phase B Core (5-7 days)

**Goal:** Users can propose, negotiate, accept, and complete trades.

**Migration `004_trades.sql`:** `trades`, `trade_decks` tables with RLS (participants only).

**Build:**

- Trade proposal flow: select deck(s) to offer, cash difference, message
- Trades list page (`/(protected)/trades/`)
- Trade detail page (`/(protected)/trades/[id]/`) — status timeline, actions
- Status machine: proposed → accepted/declined/countered → completed/cancelled/disputed
- Contact info sharing on acceptance (with PIPEDA consent checkbox)
- "Confirm complete" for both parties
- `src/lib/services/trades.ts` — full trade lifecycle
- Supabase Realtime subscription for live trade status updates

**Dev split:** Dev A → proposal flow, trades list, trades service. Dev B → trade detail page, Realtime, contact sharing, migration.

**Depends on:** M4

---

## Milestone 6: Reviews & Reputation (2 days)

**Goal:** Post-trade reviews. Reputation scores on profiles.

**Migration `005_reviews.sql`:** `reviews` table with RLS. Trigger to update `users.trade_rating`.

- Review prompt after trade completion
- Review form: 1-5 stars + optional comment
- Reviews on public profile
- Reputation calculation: avg rating + completed trade count

**Dev split:** Dev A → review form + profile display. Dev B → migration, service, reputation trigger.

**Depends on:** M5

---

## Milestone 7: Want Lists (2-3 days)

**Goal:** Users describe decks they're looking for. Basic matching.

**Migration `006_want_lists.sql`:** `want_lists` table with RLS.

- Create/edit want list (`/(protected)/want-lists/new/`)
- Browse want lists (`/(public)/want-lists/`)
- Want lists on dashboard
- Basic matching: when a deck is listed, check for overlapping want lists (commander, colors, value, city)
- `src/lib/services/wantlists.ts`

**Dev split:** Dev A → CRUD pages + service. Dev B → browse page, matching logic.

**Depends on:** M3. **Can run in parallel with M5-M6.**

---

## Milestone 8: Email Notifications (2-3 days)

**Goal:** Email for key trade events via Resend.

**Migration `007_notification_prefs.sql`:** Add `notification_preferences` jsonb column to `users`.

- Resend integration (API routes or Edge Functions)
- Email templates: trade proposed/accepted/declined, trade complete, want list match
- Notification preferences UI in settings
- DB trigger or webhook to fire emails on trade status changes

**Dev split:** Dev A → Resend integration, sending service. Dev B → email templates, preferences UI.

**Depends on:** M5 + M7

---

## Milestone 9: Onboarding & Landing Page (2-3 days)

**Goal:** Polished first-time experience and compelling public landing page.

- Landing page: hero, value prop, featured decks, CTA
- Enhanced onboarding: signup → username → city → import first deck (Moxfield happy path) → mark for trade
- Google OAuth (deferred from M1 — requires Google Cloud Console + real domain)
- OG/meta tags for SEO and social sharing

**Dev split:** Dev A → landing page, OG tags. Dev B → onboarding flow, featured decks.

**Depends on:** M3

---

## Milestone 10: Polish & Mobile (3-5 days)

**Goal:** Production-ready quality.

- Mobile-responsive pass on all pages
- Loading skeletons, error boundaries, empty states
- Form validation everywhere
- Account deletion + data export (PIPEDA)
- Rate limiting on API routes
- Image optimization, lazy loading, pagination
- Accessibility pass
- Favicon, PWA manifest basics

**Dev split:** Dev A → mobile, loading states, errors. Dev B → account deletion, data export, perf, a11y.

**Depends on:** All milestones

---

## Milestone 16: Security Hardening (pre-launch blocker)

**Goal:** Close all security gaps found in the pre-launch audit. Nothing here is optional.

**Migration `018_restrict_user_updates.sql`:**

- Restrict UPDATE on `users` so `trade_rating`, `completed_trades` cannot be set by the row owner — only by triggers.
- Restrict UPDATE on `trades` so `cash_difference_cents` cannot change after creation.
- Add path-based validation to `deck-photos` storage policy (upload path must include `auth.uid()`).

**Build:**

- **Security headers** — add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and a baseline CSP in `next.config.ts` `headers()`.
- **Verify `CRON_SECRET`** is set on Vercel production env. Add to `.env.example` with docs.
- **Remove Resend demo key** from `.env.development` — replace with placeholder.
- **Input validation** — validate URLs with `new URL()` + length cap in `/api/import/url`. Validate UUIDs on deck/trade ID params in API routes.
- **Account deletion confirmation** — require password re-entry before deleting. Consider soft-delete with 30-day grace period.
- **Generify error messages** — never return raw `error.message` from Supabase auth to the client.

**Depends on:** None (can start immediately)

---

## Milestone 23: Observability & Monitoring (pre-growth blocker)

**Goal:** Stop flying blind. Get error tracking, performance monitoring, and deploy verification in place before real users hit the platform. Inspired by Tipped's production setup — they have Sentry + Vercel Analytics + health checks and it's caught issues that would have gone unnoticed.

**Build:**

- **Sentry integration** — install `@sentry/nextjs`, configure for client/server/edge errors. Add session replay (with CSP-safe `beforeSend` filter for rrweb EvalError noise, per Tipped's experience). Wire up global error boundary with Sentry reporting. Use `SENTRY_DSN` env var, add to `.env.example`.
- **Health check endpoint** (`/api/health`) — verify Supabase connectivity (simple query), check required env vars are set, return JSON with status + timestamp. Use as post-deploy verification target.
- **Vercel Analytics** — add `@vercel/analytics` for page views and Web Vitals. Add `@vercel/speed-insights` for performance tracking. Both are drop-in `<Analytics />` and `<SpeedInsights />` components in root layout.
- **Post-deploy smoke test** — GitHub Action that runs after Vercel deploy, hits `/api/health` on the deployment URL, fails the check if unhealthy. Prevents silent deploy breakage.
- **Vercel ignore build script** (`scripts/vercel-ignore-build.sh`) — skip Vercel builds for doc-only changes (PLAN.md, PROGRESS.md, DECISIONS.md, README.md). Saves build minutes as the repo grows.

**Depends on:** None (should be done FIRST — highest priority infrastructure gap)

---

## Milestone 24: Email Polish & Re-engagement

**Goal:** Professional email experience and automated re-engagement. Current state: trade/want-list notifications work via Resend, but auth emails are generic Supabase defaults, and there's no re-engagement for inactive users.

**Build:**

- **Branded auth emails** — replace all 5 default Supabase email templates with custom branded HTML (confirm signup, reset password, magic link, change email, invite). Use DeckShark branding, colors, and logo. Configure in Supabase dashboard (Auth → Email Templates) or via config.toml for local dev.
- **Re-engagement cron job** — daily Vercel cron (e.g., 15:00 UTC) that emails users inactive for 14+ days. Batch limit 50 per run. Track `last_nudge_sent_at` on users table (migration required). Content: "Your decks are waiting — X traders in [city] are browsing." HMAC-signed unsubscribe link.
- **Unsubscribe handling** — `/api/email/unsubscribe` route supporting both GET (browser click) and POST (RFC 8058 List-Unsubscribe). HMAC verification to prevent abuse. Update `email_updates_opt_in` or notification preferences.
- **Data export** (PIPEDA compliance) — restore `/api/account/export` endpoint (was removed in April 5 session). Export user's decks, trades, reviews, want lists as JSON. Important for privacy compliance alongside existing account deletion.

**Migration `0XX_nudge_tracking.sql`:**

- Add `last_nudge_sent_at timestamptz` and `email_updates_opt_in boolean DEFAULT true` to `users` table.
- Create RPC `get_inactive_users_for_nudge()` — returns users where last tip/trade/login was 14+ days ago, `email_updates_opt_in = true`, and `last_nudge_sent_at` is null or 7+ days ago.

**Depends on:** None (can run in parallel with M17/M18)

---

## Milestone 17: Rate Limiting & Abuse Prevention

**Goal:** Every public and mutation API route has real, production-safe rate limiting.

**Build:**

- **Migrate rate limiting to Upstash Redis** — replace in-memory `Map` in `rate-limit.ts` with `@upstash/ratelimit`. The current in-memory approach resets per serverless invocation, so it's effectively no-op on Vercel.
- **Add rate limits to unprotected routes:**
  - `/api/cities/search` — 20 req/min/IP
  - `/api/commanders/search` — 20 req/min/IP
  - `/api/cards/search` — 20 req/min/IP
  - `/api/notify/trade` — 5 req/min/user
  - `/api/auth/signout` — 5 req/min/IP
  - `/api/account/export` — 1 req/hour/user
  - `/api/account/delete` — 1 req/hour/user
- **Notification idempotency** — add `last_match_notification_at` to `want_lists` table; skip re-notify within 24h. Add idempotency to trade notifications (don't send same event twice).

**Depends on:** M16 (security headers should land first)

---

## Milestone 18: Performance & Caching

**Goal:** Eliminate the biggest performance bottlenecks before real traffic hits.

**Migration `019_browse_indexes.sql`:**

```sql
CREATE INDEX idx_decks_available ON decks(available_for_trade) WHERE available_for_trade = true;
CREATE INDEX idx_decks_value ON decks(estimated_value_cents);
CREATE INDEX idx_decks_browse ON decks(user_id, available_for_trade, status);
```

**Build:**

- **Database-level pagination** — refactor `getPublicDecks()` and `getPublicWantLists()` to use `.range(from, to)` instead of fetching all rows and slicing client-side. Pass page as a search param.
- **ISR caching on public pages:**
  - Homepage: `export const revalidate = 3600` (1 hour)
  - `/decks` browse: `export const revalidate = 300` (5 min)
  - `/decks/[id]` detail: `export const revalidate = 600` (10 min)
  - `/want-lists` browse: `export const revalidate = 300`
  - `/profile/[username]`: `export const revalidate = 600`
- **Optimize card queries** — replace `select('*')` in `cards.ts` with explicit column lists.
- **Fix profile page waterfall** — fetch user, decks, and reviews in parallel with `Promise.all()`.
- **Use `next/image`** everywhere — replace raw `<img>` tags in trade detail and landing page.
- **Add fetch timeout** to Scryfall API calls (10s).
- **Batch RPC functions** — follow Tipped's pattern of eliminating N+1 queries with Postgres functions. Candidate: `get_browse_decks()` that returns decks + owner info + interest counts in a single query instead of sequential fetches. Profile page: single RPC for user + decks + reviews + trade stats.

**Depends on:** None (can run in parallel with M16/M17)

---

## Milestone 19: Admin Portal (5-7 days)

**Goal:** Internal admin dashboard for platform oversight, user management, moderation, and feedback collection. Essential once real users are on the platform.

**Route group:** `(admin)/` — requires auth + `is_admin` flag on the `users` table.

**Migration `020_admin.sql`:**

- Add `is_admin boolean DEFAULT false` to `users` table (no public write — only settable via service role).
- Create `reports` table: `id`, `reporter_id`, `target_type` (enum: `user`, `deck`, `trade`, `message`), `target_id`, `reason`, `status` (enum: `open`, `reviewed`, `resolved`, `dismissed`), `admin_notes`, `created_at`, `resolved_at`, `resolved_by`. RLS: reporters can insert + read own, admins can read/update all.
- Create `feedback` table: `id`, `user_id` (nullable — allow anonymous), `category` (enum: `bug`, `feature`, `general`), `message`, `status` (enum: `new`, `reviewed`, `archived`), `admin_notes`, `created_at`. RLS: anyone can insert, admins can read/update all.
- Create `user_suspensions` table: `id`, `user_id`, `reason`, `suspended_by`, `suspended_at`, `expires_at` (nullable — null = permanent), `lifted_at`, `lifted_by`. RLS: admins only.

### Phase 1: Stats Dashboard

- **Platform overview** — total users, decks, active trades, completed trades, want lists, total trade value
- **Growth charts** — new users/decks/trades per day/week/month (query `created_at` aggregations)
- **Card sync status** — last sync timestamp, total cards in cache, last error if any
- **Onboarding funnel** — signup → onboarding complete → first deck created → first trade proposed → first trade completed (drop-off percentages)
- **Geographic distribution** — user count by province, top cities

### Phase 2: User Management

- **User list** — searchable/sortable table (username, email, city, province, join date, deck count, trade count, rating)
- **User detail view** — profile info, all decks, trade history, reviews given/received, email preferences
- **Suspend/unsuspend user** — with reason, optional expiration date, logged in `user_suspensions`
- **Middleware check** — suspended users see a "Your account is suspended" page with reason and expiry

### Phase 3: Trade Oversight

- **Trade feed** — chronological stream of trade activity with status badges (proposed, accepted, completed, declined, cancelled)
- **Trade detail view** — both parties, decks involved, messages, timeline, value
- **Trade analytics** — average trade value, most-traded formats, most-traded commanders, completion rate

### Phase 4: Content Moderation & Reporting

- **"Report" button** — add to deck detail, profile, and trade pages site-wide. Opens a modal with reason selector + optional description. Creates a `reports` row.
- **Reports queue** — admin view of open reports, filterable by type/status. Mark as reviewed/resolved/dismissed with notes.
- **Deck moderation** — flag or hide decks with suspicious content. Bulk actions on the reports queue.
- **Photo moderation** — thumbnail grid of recently uploaded deck photos for quick review.

### Phase 5: Feedback & Support

- **Feedback form** — accessible from footer or help menu. Category selector (bug/feature/general) + message. Works for logged-in and anonymous users. Collect metadata automatically: page_url, page_route, viewport, device, referrer, client errors (per Tipped's pattern — this context is invaluable for debugging reports).
- **Feedback inbox** — admin view with status filters (new/reviewed/archived). Triage by sentiment. Add internal notes.
- **Email delivery stats** — surface Resend delivery/bounce rates (via Resend API) on the admin dashboard.

### Phase 6: Platform Health

- **Rate limit dashboard** — show top rate-limited IPs/users, hit counts by endpoint (requires logging rate limit events to a table or reading from Upstash).
- **Sentry integration in admin** — embed Sentry error feed or build lightweight error summary by route/type (M23 must be in place first).
- **Storage usage** — deck-photos bucket size and growth (Supabase Storage API).

### Phase 7: Anti-Gaming & Trade Quality

- **Outlier detection trigger** on `trades` INSERT/UPDATE — flag trades where value difference is suspiciously lopsided (e.g., $500 deck offered for $20 deck with no cash). Only activates when baseline trade data exists. Flagged trades excluded from public stats, queued for admin review.
- **Review spam detection** — flag reviews from accounts with no completed trades, or duplicate review text across users.
- **Audit log** — track all admin actions (suspend, flag, edit, delete) with admin_user_id, timestamp, target_type, target_id, details JSONB. Required for accountability as platform grows.

**Build:**

- `src/lib/services/admin.ts` / `admin.server.ts` — admin service layer (stats queries, user management, reports, feedback)
- `src/lib/middleware/admin.ts` — admin route protection (check `is_admin` flag)
- `src/components/admin/` — dashboard charts, data tables, report cards, feedback list
- `src/app/(admin)/admin/` — admin route group with nested pages:
  - `/admin` — stats dashboard
  - `/admin/users` — user list
  - `/admin/users/[id]` — user detail
  - `/admin/trades` — trade feed
  - `/admin/reports` — reports queue
  - `/admin/feedback` — feedback inbox
- Public-facing additions:
  - Report modal component (reusable, placed on deck/profile/trade pages)
  - Feedback form (footer link or help menu)
  - Suspension check in middleware

**Dev split:** Phase 1-2 can be one dev, Phase 3-4 another. Phases 5-6 are smaller and can be picked up by whoever finishes first.

**Depends on:** M16-M18 (hardening should land first — admin portal assumes rate limiting and security headers are in place)

---

## Timeline & Parallelization

```
Week 1:   M0 (1 day) → M1 + M2 in parallel (2-3 days)
Week 2:   M3 — Phase A core (5-7 days) ← BIGGEST MILESTONE
Week 3:   M4 (2-3 days) + M7 starts in parallel
Week 3-4: M5 — Trading core (5-7 days) + M7 continues
Week 4:   M6 (2 days) + M8 (2-3 days)
Week 5:   M9 (2-3 days) + M10 (3-5 days)
```

**Phase A live after M3** (~end of week 2) — start collecting users and feedback.
**Phase B live after M6** (~end of week 4) — trading works.
**Full MVP after M10** (~end of week 5-6).

---

## Migration Ownership Protocol

- Only one dev writes a migration at a time
- Announce before starting; second dev rebases on top
- For M1+M2 parallel: Dev B writes `001_users.sql` first, Dev A writes `002_card_cache.sql` after

---

## CLAUDE.md Conventions (established in M0)

- Components never import from `@/lib/supabase/*` — always through `@/lib/services/*`
- Service functions return `{ data, error }` pattern
- File naming: kebab-case. Components: PascalCase
- Route groups: `(auth)`, `(public)`, `(protected)`
- Prices stored as cents (int), displayed as formatted USD
- Types in `src/types/`, DB types via `supabase gen types typescript`
- shadcn/ui as component base, Tailwind utilities for custom styles

---

## Verification

After each milestone:

1. `pnpm build` succeeds with no type errors
2. Vercel preview deployment works
3. Manual QA of the milestone's features on both desktop and mobile
4. RLS policies verified (test as different users, test unauthenticated)

End-to-end smoke test for full MVP:

1. Sign up → onboarding → import deck from Moxfield → see on dashboard
2. Mark deck for trade → appears in public browse
3. Second user proposes trade → first user accepts → contact info shared
4. Both confirm complete → leave reviews → reputation updates
5. Create want list → list matching deck → email notification sent

---

## Milestone 20: UX Overhaul — Browse-First Funnel (pre-growth blocker)

**Goal:** Minimize time-to-value. Visitors see live decks immediately, signup is triggered by engagement, not forced upfront. Reduce bounce rate in first 30 seconds.

**Build:**

- **Landing page → browse-first** — replace the hero-heavy landing page with a layout that leads with the live deck browse grid. Keep a concise value prop banner at top, but the primary content is real decks. Alternatively, redirect `/` to `/decks` with a welcome banner for unauthenticated users.
- **Remove forced deck creation from onboarding** — after signup, onboarding collects username + city/province, then redirects to `/decks` (browse) instead of `/decks/new`. Add a persistent but dismissable "List your first deck" prompt on the dashboard instead.
- **Engagement-triggered auth prompts** — on deck detail page: "Sign up to propose a trade" CTA (replaces hidden propose button for logged-out users). On want list detail: "Sign up to list a matching deck." On browse page: "Sign up to trade — it's free" banner (subtle, not blocking).
- **City autocomplete on onboarding/settings** — replace plain text city input with the existing `/api/cities/search` autocomplete component. Reduces user error, improves location matching.
- **"Sign up to trade, it's free" banner** — persistent top banner on public pages for unauthenticated users. Dismissable, not intrusive.

**Depends on:** None (can start immediately — highest priority for growth)

---

## Milestone 21: Remote Interest Signal ("I'd trade for this")

**Goal:** Capture demand signal from users who would trade if shipping were available. Data informs when to launch shipping (Phase 2). Retention hook for deck owners ("4 people across Canada want this deck").

**Migration `0XX_deck_interests.sql`:**

- Create `deck_interests` table: `id`, `user_id`, `deck_id`, `created_at`. Unique constraint on `(user_id, deck_id)`. RLS: authenticated users can insert/delete own, public read count.

**Build:**

- **"Interested" button on deck detail page** — visible when the deck is in a different city than the viewer. Shows count ("12 interested"). One click to express interest, click again to remove. Requires auth (engagement-triggered signup if logged out).
- **Interest count on deck cards** — show "X interested" badge on browse grid cards when count > 0. Social proof + urgency signal.
- **Owner notifications** — email deck owner when interest count crosses thresholds (1, 5, 10, 25). "5 people across Canada are interested in your [deck name]."
- **Dashboard interest summary** — deck owners see total interest across their decks. "Your decks have 23 interested traders — shipping coming soon."
- **Analytics query** — admin can see interest by city pair (e.g., "Toronto users interested in Vancouver decks") to inform shipping launch timing.

**Depends on:** M20 (engagement-triggered auth must be in place for logged-out interest clicks)

---

## Milestone 22: Notification System

**Goal:** Centralized notification bell replacing scattered badge counts. Unified inbox for all user-facing events — trades, want-list matches, reviews, and future event types.

**Migration `0XX_notifications.sql`:**

- Create `notifications` table: `id`, `user_id`, `type` (enum: trade_proposed, trade_countered, trade_accepted, trade_declined, trade_completed, want_list_match, review_received), `title`, `body`, `link` (URL to navigate on click), `read` (boolean, default false), `created_at`. RLS: users can read/update own.

**Build:**

- **Bell icon with unread count** — header bell shows count of unread notifications. Already wired to `/trades` as interim; replace with dropdown or `/notifications` page.
- **Notification dropdown** — click bell to see recent notifications with type icon, title, time ago, read/unread styling. Click to navigate + mark read.
- **Create notifications on events** — trade proposals, counter-offers, acceptances, declines, completions, want-list matches, reviews. Replace direct email-only flow with notification + optional email.
- **Mark all read** — bulk action in dropdown.
- **Notification preferences** — settings page toggle for which types generate email vs. in-app only.

**Depends on:** M20 (header redesign with bell icon already in place)

---

## Phase 3 Concept: Deck Rotation Subscription (future exploration)

> **Status:** Idea stage — not planned for implementation yet. Captured here for future reference.

### Core Idea

A monthly/bi-monthly subscription service where members pay a fee (~$15/mo) and receive a rotating deck. After the rotation period, you ship your deck to the next subscriber and receive a new one. If you love the deck you received, you can buy it outright.

### Why This Could Work

- Solves "I want to try new decks but can't afford them all" — competitive MTG decks cost $200-500+
- Builds on DeckShark's existing deck logistics and trading infrastructure
- Buy-out option creates additional revenue beyond subscriptions
- Recurring revenue model for the business

### Open Questions

- **Deck condition tracking** — need inspection/grading between rotations to handle wear and disputes
- **Buy-out pricing** — flat price? Depreciation with use? Market-based?
- **Format matching** — subscribers specify formats (Standard, Modern, Commander, Pioneer) so they get playable decks
- **Rotation logistics** — coordinating "ship old, receive new" timing so nobody is deckless for weeks
- **Loss/damage insurance** — what happens if a deck is lost in mail or cards go missing?
- **Deck sourcing** — does DeckShark own the inventory, or are decks contributed by other users?

### Potential Tiers

| Tier      | Price      | Rotation       | Deck Level             |
| --------- | ---------- | -------------- | ---------------------- |
| Budget    | ~$15/mo    | Every 2 months | Budget-friendly builds |
| Premium   | ~$25-30/mo | Monthly        | Competitive-tier decks |
| Commander | ~$20/mo    | Every 2 months | EDH/Commander focused  |

### Prerequisites

- Phase 2 (US-Canada cross-border shipping) must be operational first
- Reliable deck condition grading system
- Sufficient deck inventory or user-contributed pool
- Payment/subscription infrastructure (Stripe recurring billing)
