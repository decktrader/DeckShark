# DeckTrader — Progress Tracker

## Current Focus

**Milestone:** M26 in progress
**Status:** M26 (Settings Overhaul) implementation complete — tabbed settings, country/state support, password change, forgot password, privacy & data tab. Migration 031 applied locally. Needs production migration + testing.
**Next step:** Push M26, apply migration 031 to production. Then M27 (Support DeckShark) → M28 (Seed Content).
**Blocked:** Nothing.
**Dev note:** Dev server switched to Webpack (`--webpack`) with 4GB memory cap to prevent system freezes from Turbopack CPU spikes. Mobile testing via Chrome DevTools (Cmd+Shift+M) — local dev server HMR blocks React hydration over network IP, but production works fine on mobile.

---

## Milestone Status

| Milestone                            | Status   | Notes                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0: Project Scaffolding              | Complete |                                                                                                                                                    |
| M1: Auth & User Profiles             | Complete | Google OAuth deferred to M9                                                                                                                        |
| M2: Card Data Infrastructure         | Complete |                                                                                                                                                    |
| M3: Deck Management (Phase A)        | Complete | Text import only, URL importers in M4                                                                                                              |
| M4: Public Browsing                  | Complete |                                                                                                                                                    |
| M5: Trading (Phase B)                | Complete | Realtime updates optional polish                                                                                                                   |
| M6: Reviews & Reputation             | Complete |                                                                                                                                                    |
| M7: Want Lists                       | Complete |                                                                                                                                                    |
| M8: Email Notifications              | Complete |                                                                                                                                                    |
| M9: Onboarding & Landing Page        | Complete | Google OAuth deferred                                                                                                                              |
| M10: Polish & Mobile                 | Complete | Sleeves/deckbox, skeletons, error boundaries, pagination, rate-limit, account deletion/export, mobile nav, a11y, PWA                               |
| M11: Browse Filters                  | Complete | Power level, color identity, archetype, sort, collapsible panel, city autocomplete, profile city default, DeckShark rebrand                        |
| M12: Production Deploy               | Complete | deckshark.gg live on Vercel, Google OAuth, production Supabase migrations applied                                                                  |
| M13: Counter-Offers                  | Complete | Counter-offer form, cash slider, trade badge, enhanced trades list, email notifications                                                            |
| M14: Color Identity Filter           | Complete | Implemented in M11 — ColorIdentitySelector, browse filter, server query with .contains()                                                           |
| M15: Disputes                        | Deferred | Build when user base warrants                                                                                                                      |
| **M16: Security Hardening**          | Complete | RLS column restrictions, security headers, account deletion confirmation, UUID validation, auth error generification. PR #13 merged.               |
| **M17: Rate Limiting**               | Complete | Upstash Redis (@upstash/ratelimit) on all routes. 4 tiers: search/mutation/notify/auth. Graceful fallback without Redis.                           |
| **M18: Performance & Caching**       | Complete | DB pagination (.range()), browse indexes (027), Scryfall fetch timeouts, next/image, ISR on want-lists                                             |
| **M19: Admin Portal**                | Complete | Stats dashboard, user mgmt, trade oversight, reports queue, feedback inbox, suspension system, report/feedback public components                   |
| **M20: UX Overhaul**                 | Complete | Browse-first landing page, onboarding redirects to /decks, city autocomplete on forms, public want-list detail with auth prompt                    |
| **M21: Remote Interest Signal**      | Complete | "Want this shipped?" vote on non-local decks, interest badges, dashboard wanted list, threshold emails, admin city-pair analytics                  |
| **M22: Notification System**         | Complete | Centralized bell dropdown + /notifications page, in-app notifications on all events, per-type email preferences, server-rendered initial data      |
| **M23: Observability**               | Complete | Sentry, /api/health, Vercel Analytics + Speed Insights, post-deploy smoke test. Needs Sentry DSN + Analytics enabled in prod.                      |
| **M24: Email Polish**                | Complete | Branded auth emails, re-engagement cron, HMAC unsubscribe, data export (PIPEDA)                                                                    |
| **M25: Mobile Polish & QA**          | Complete | V4D browse cards, filter sheet, list/grid toggle, sticky deck detail bar, stacked trade cards, notification sheet, responsive grids, touch targets |
| **M26: Settings Overhaul**           | Complete | Tabbed settings (profile, notifications, account, privacy & data). Country/state support (CA+US). Password change, forgot password, data export.   |
| **M27: Support DeckShark**           | Planned  | Stripe tips ($3/$5/$10/$25/custom), supporter badge, post-trade nudge, /support page, admin stats. Stripe foundation for future shipping fees.     |
| **M28: Seed Content & Empty States** | Planned  | Seed decks, "be the first" empty state, want-list-first nudge, "coming soon to your city" section                                                  |
| **M29: Regional Launch Strategy**    | Planned  | Game store outreach kit, city landing pages, referral tracking, community outreach list                                                            |
| **M30: Game Store Partnerships**     | Planned  | Store directory, store badge on decks, store dashboard, QR code generator                                                                          |
| Branch Protection                    | Planned  | Protect main branch — require PRs, no direct pushes to production                                                                                  |

## Recent Changes

<!-- Newest entries at the top. One entry per work session. -->

### 2026-04-17 — M26 Settings Overhaul

**Migration:** 031 (country column on users, default 'CA', check constraint CA/US).

**Country/State support:** Added `country` field to users. Onboarding and settings forms now have country picker (Canada/US) with cascading state/province dropdown. Browse filters updated with grouped region selector (Canada provinces + US states). All 50 US states + DC added. Admin geo distribution relabeled "Users by region". Privacy policy updated.

**Tabbed settings:** Refactored monolithic settings form into 4-tab layout (Profile, Notifications, Account, Privacy & Data). Horizontal scrollable tab bar works on mobile. Avatar sidebar stays in Profile tab. Notification preferences have save button. Marketing email opt-in toggle in Notifications tab.

**Account tab:** Password change form for email users (verifies current password, then updates). AccountDangerZone moved inside Account tab. OAuth users only see the danger zone (no password form).

**Forgot password flow:** New `/forgot-password` page with email form. Sends Supabase reset link. New `/reset-password` page handles the magic link callback and lets user set a new password. "Forgot password?" link added to login form.

**Privacy & Data tab:** Data export button (downloads JSON via `/api/account/export`). Privacy summary with link to full policy.

**Other:** Fixed pre-existing test failure (missing NotificationPreferences fields in test fixture). Added `email_updates_opt_in` to allowed user update fields.

**Next:** Push, apply migration 031 to production. Then M27 (Support DeckShark).

### 2026-04-17 — M25 Mobile Polish & QA (complete)

**Migrations:** 029-030 applied to production Supabase.

**iOS touch bug resolved:** Root cause was dev server HMR WebSocket connecting to `localhost` from the phone, blocking React hydration. Production was never affected — all buttons work fine on deckshark.gg. Not a real bug.

**Phase 1 — Browse, Deck Detail, Trade Detail:**

- Browse: mobile filter bottom sheet (VA pattern), compact V4D grid cards (square art thumbnails), list/grid toggle via URL param, extracted shared `DeckBrowseCard` component
- Deck detail: sticky bottom action bar on mobile with "Propose trade" + "Want this shipped?" buttons, sidebar hidden on mobile
- Trade detail: stacked vertical deck cards on mobile instead of cramped 2-col grid
- Middleware fix: removed `/decks` from protected paths (was blocking public browse for unauthenticated users)

**Phase 2 — Landing Page, Trade List, Notification Bell:**

- Landing page: same mobile browse layout (filter bar, V4D cards, list/grid toggle), sign-up CTAs hidden for logged-in users
- Trade list: compact horizontal cards with overlapping art thumbnails, truncated deck names
- Notification bell: bottom Sheet on mobile instead of absolute dropdown

**Phase 3 — Dashboard, Profile, Forms, Touch Targets:**

- Dashboard: responsive stat grid (2→3→5 col), responsive number sizing, 2-col deck grid, deck card info bar overflow fix (price + Trading/Private stacked)
- Profile: horizontal avatar row on mobile, 2-col deck grid
- Settings form: inputs stack on mobile, avatar buttons padded for touch
- Want lists: responsive heading, stacked card headers, smaller padding
- Touch targets: pagination buttons 36→40px, hamburger 40→44px, nav auth buttons to default size
- Want list detail: header stacks vertically, criteria pill text bumped to 11px

**Next:** M26 (Settings Overhaul) → M27 (Support DeckShark) → M28 (Seed Content).

### 2026-04-14 — M21, M22, Cold Start Fixes, Milestones M27-M30

**M21 Done:** Migration 029 (deck_interests table). "Want this shipped?" voting (V3B: globe info card + purple button) on non-local deck detail pages. Propose trade demoted to outline with amber location warning for non-local decks. Interest badges on browse cards + homepage. Dashboard: "Interested" stat card + "Decks you want" list (V2B). Threshold email notifications at 1/5/10/25. Admin city-pair interest analytics. Removed dead getGrowthData.

**M22 Done:** Migration 030 (notifications table, expanded notification_preferences). NotificationBell dropdown replaces TradeBadge — server-rendered initial data, type-specific icons, mark all read, view all. Full /notifications page. All notify routes create in-app notifications. New /api/notify/review route. Settings: 4 email preference toggles.

**Other:** Removed auto province filter on browse (show all decks globally). Added "Near me" quick filter chip. Removed "Optimized" chip. Dead code audit saved to memory. Added M27 (Stripe tips), M28 (seed content/empty states), M29 (regional launch), M30 (game store partnerships).

**Production needs:** Apply migrations 029-030 to production Supabase.
**Next:** M25 (Mobile Polish) → M28 (Seed Content) → M29 (Regional Launch).

### 2026-04-14 — M22 Notification System

**Done:** Migration 030 (notifications table, RLS, partial index on unread, expanded notification_preferences with review_received + interest_threshold). NotificationBell dropdown replaces TradeBadge — server-rendered initial data, type-specific icons (Handshake/ArrowLeftRight/CheckCircle/XCircle/Star/Package/Search), unread dots, mark all read, view all link. Full /notifications page with simple list layout. All notify routes (trade, want-list-match, deck-interest) now create in-app notifications alongside emails. New /api/notify/review route + review form fires it on submit. Settings form expanded: 4 email preference toggles (trade updates, want list matches, reviews, shipping interest).

**Production needs:** Apply migrations 029-030 to production Supabase.
**Next:** M25 (Mobile Polish & QA) or M26 (Settings Overhaul).

### 2026-04-14 — M21 Remote Interest Signal

**Done:** Migration 029 (deck_interests table, RLS, indexes, interest_thresholds_notified on decks). Service layer: client toggle (add/remove interest), server batch counts, user wanted decks, admin city-pair analytics. InterestToggle component (V3B): globe info card + purple "Want this shipped?" button on non-local deck detail pages. Propose trade demoted to outline with amber "This trader is in [city] — local meetup required" warning on non-local decks. Browse cards + homepage show pink heart "X interested" badge when count > 0. Dashboard: 5th stat card (pink "Interested" count), "Decks you want" section (V2B — square art thumbnails with heart overlay, commander, map pin, price). Threshold email notifications at 1/5/10/25 interests via /api/notify/deck-interest. Admin dashboard: interest demand by city pair table. Removed dead getGrowthData function + GrowthRow interface. Dead code audit saved to memory for future cleanup.

**Production needs:** Apply migration 029 to production Supabase.
**Next:** M22 (Notification System).

### 2026-04-12 — M18 Performance, M19 Admin Portal, Admin Enhancements

**M18 Done:** Migration 027 (browse indexes). Server-side pagination with .range() on getPublicDecks/getPublicWantLists. 10s Scryfall fetch timeouts. Raw `<img>` → next/image. ISR on want-lists.

**M19 Done:** Migration 028 (is_admin, reports, feedback, user_suspensions, get_admin_stats RPC). Full admin portal: dashboard (8 stat cards, card cache stats, activity feed), user management (searchable, deck/listed counts, suspend/lift), trade oversight (filterable), reports queue (resolve/dismiss), feedback inbox (review/archive). Public ReportButton on deck/profile pages. FeedbackForm in footer. Suspension middleware + /suspended page.

**Admin enhancements:** Growth page with interactive bar charts (7d/30d/90d/1y, click metrics to switch). Username in user menu dropdown. Admin link in header (admin-only). Card cache stats + manual sync link. Recent activity feed. User deck count + listed-for-trade columns.

**Production:** Migrations 027-028 applied. Branded auth email templates pasted into Supabase. GreatWhite account granted admin. `git push` now permission-blocked in settings.local.json.

**Next:** M21 (Remote Interest Signal) → M22 (Notification System). See BACKLOG.md for deferred M19 Phase 6-7 items.

### 2026-04-12 — M18 Performance & M19 Admin Portal (superseded by entry above)

**M18 Done:** Migration 027 (browse indexes: idx_decks_browse, idx_decks_value, idx_want_lists_browse). Server-side pagination with .range() + count on getPublicDecks and getPublicWantLists (falls back to client-side when city/province filters or power-level sort active). 10s AbortController timeout on all Scryfall API fetch calls. Replaced raw `<img>` with next/image on homepage, browse, want-lists. ISR revalidate (5min) on want-lists page. Homepage/browse can't use ISR due to auth-dependent default city/province.

**M19 Done:** Migration 028 (is_admin flag with trigger protection, reports table, feedback table, user_suspensions table, get_admin_stats RPC, RLS policies, indexes). Admin service layer (admin.server.ts: stats, growth data, geographic distribution, user management, suspensions, reports, feedback, trades). Admin layout with sidebar nav ((admin)/admin/). 5 admin pages: dashboard (stat cards, 30d growth tables, geographic distribution), users list (searchable, paginated), user detail (decks, reviews, suspend/lift actions), trades (filterable by status), reports queue (resolve/dismiss actions), feedback inbox (mark reviewed/archive). Server actions for suspend/lift/report-update/feedback-update with admin auth check. Suspension middleware redirect to /suspended page. Public ReportButton component on deck detail and profile pages. FeedbackForm component in root layout footer. Branded auth email templates pasted into production Supabase (manual step completed).

**Production needs:** Apply migration 027 + 028. Set testuser as admin via service role.
**Next:** M21 (Remote Interest Signal) → M22 (Notification System).

### 2026-04-12 — M24 Email Polish + Production Deploy + Fixes

**Done:** Migration 026: `email_updates_opt_in` and `last_nudge_sent_at` columns on users, `get_inactive_users_for_nudge()` RPC. Rebranded all emails from DeckTrader → DeckShark with purple brand header and tagline. Added `List-Unsubscribe` + `List-Unsubscribe-Post` headers to all outgoing Resend emails (improves deliverability). HMAC-signed `/api/email/unsubscribe` endpoint (GET for browser, POST for RFC 8058). `sendReEngagementEmail()` with featured local decks (V3C design — big purple stats banner + right-aligned prices). Daily cron `/api/cron/nudge-inactive` at 15:00 UTC (batch 50). Restored `/api/account/export` for PIPEDA data export. 5 branded Supabase auth templates. Migration 026 applied to production. HMAC_SECRET set on Vercel. Marketing strategy doc created (MARKETING-STRATEGY.md). M26 Settings Overhaul milestone added. Cash difference input fixed to allow cents (step="0.01"). New deck form defaults to "Create deck and list for trade" with opt-out checkbox. CLAUDE.md updated: DeckShark branding, not Canada-only, prefer db push over db reset.
**Production still needs:** Paste branded auth templates into Supabase dashboard (Auth → Email Templates) — config.toml only works locally.
**When shipping launches:** Add "Trading globally" section to re-engagement email below the "New in [city]" local decks.
**Next:** M18 (Performance & Caching).

### 2026-04-12 — M17 Rate Limiting

**Done:** Replaced in-memory rate limiter with Upstash Redis (@upstash/ratelimit sliding window). Added rate limiting to all API routes: cards/search, cities/search, commanders/search (30/min), import/url (10/min), notify/trade, notify/want-list-match (20/min), account/delete, auth/callback (5/min). Graceful fallback when Redis not configured (local dev). Updated .env.example.
**Next:** Install Upstash via Vercel Marketplace for production. Then M24 (Email Polish).

### 2026-04-12 — M23 Observability

**Done:** Added /api/health endpoint (pings Supabase, returns JSON status + latency). Installed @sentry/nextjs with client/server/edge init, global-error boundary, source map upload config, and tunnel route. Added @vercel/analytics and @vercel/speed-insights to root layout. Created post-deploy smoke test GitHub Action (hits /api/health + homepage after every Vercel deploy). Updated .env.example with Sentry vars.
**Next:** Set Sentry DSN + enable Analytics in Vercel dashboard. Then M17 (Rate Limiting).

### 2026-04-08 — Dev server stability fix

**Done:** Diagnosed repeated system freezes when running `pnpm dev` — Turbopack CPU spikes were exhausting all 8 cores on 16GB machine. Switched dev script to Webpack (`next dev --webpack`) with 4GB Node memory cap (`--max-old-space-size=4096`). Committed and pushed pending UI changes from last session (trade toggle, switch component, preview routes, deck card updates).
**Next:** M17 (Rate Limiting), M21 (Remote Interest Signal), or M22 (Notification System).

### 2026-04-07 — Full UI Redesign Pass + Partner Commanders + Bracket System

**Done:** Comprehensive UI redesign of every page through iterative preview workflow (4 versions per page, drill into favorites). Power levels switched to official Commander Bracket system (bracket1-5) with migration + check constraint fix. Partner/second commander support: migration, vertical split DeckArt component, CommanderAutocomplete with Scryfall typeahead + auto color identity detection, form updates for create/edit. Fixed counter-offer RLS bug (subquery returning multiple rows). Header redesigned: taller V2C with icon+label pill nav, prominent search, bell notification icon (trade count moved from nav), avatar with chevron dropdown, "New deck" circle button. Pages redesigned: deck create (V3B accordion), deck edit (V3B icon sections + drag-drop photos), want list create/edit (V2B 4-section accordion with power level + color identity), want list detail (V2B avatar header + criteria pills), trade detail (V3D two-column + sticky floating actions), propose trade (V2 two-column + auto cash calculation), onboarding (V4 two-column branding). Browse/landing grids changed to 4-col. Added M22 Notification System milestone. 6 migrations applied to production (022-025 + RLS fix).
**Next:** M17 (Rate Limiting), M21 (Remote Interest Signal), or M22 (Notification System).

### 2026-04-06 — M20 UX Overhaul: Browse-First Funnel + Landing Page Redesign

**Done:** Full M20 implementation driven by PM feedback (reduce TTV, browse-first, engagement-triggered auth). Explored 12+ landing page variants through iterative preview workflow (V1-V4, V4A-V4D, V4C1-V4C4). Selected V4C4: split hero with 3-step action flow (browse → propose → meet up) on left, two featured decks with blurred art background on right. Featured decks rotate every 12 hours. Removed "always free/always local" wording to avoid false impressions before shipping/fees launch. Onboarding redirects to `/decks` instead of forced deck creation. City autocomplete on onboarding + settings forms. Want-list detail moved to public route with auth prompt. Added M21 (Remote Interest Signal) milestone to PLAN.md. All changes shipped to production on deckshark.gg.
**Next:** M17 (Rate Limiting) or M21 (Remote Interest Signal).

### 2026-04-05 — Full UI redesign + card hover preview + avatar upload

**Done:** Redesigned 6 pages through iterative preview workflow:

- **Want lists** — format gradient accent bars, full-bleed tinted backgrounds, inline mana color pips, bigger prices, colored format/archetype tags
- **Settings** — two-column layout with sticky sidebar (avatar + stats), avatar upload with Supabase storage (migration 021), notification cards with colored icons. Removed data export feature (not needed yet)
- **Dashboard** — frosted gradient section cards, art deck cards with inline trade toggle, colored stat boxes (violet/sky/emerald/amber accent bars) for decks/trades/completed/want lists
- **Profile** — split sidebar (avatar card + stats card + propose trade button), 3-col art deck grid, updated to DeckShark branding
- **Deck detail** — hero art banner with info bar (owner avatar + rating + format tag), colored accent stat pills, frosted decklist section
- **Card hover preview** — sticky sidebar panel shows Scryfall card image on hover, follows scroll through long decklists, context-based provider pattern
- Added 6 seed want lists for testing. Created `DeckCardNew` client component for reusable art-style deck cards with trade toggle. Updated all 5 test decks to real commander decklists (25-77 cards each) with scryfall_ids. Migration 021 (avatars bucket) applied to production. Removed data export feature. Owner rating + avatar now shown across all pages.
  **Next:** Start M17 (Rate Limiting & Abuse Prevention).

### 2026-04-05 — Want lists page redesign (superseded by full redesign above)

**Done:** Redesigned want lists page (`/want-lists`). Explored 16+ design variants across multiple rounds of previews (4 top-level layouts, then sub-variants of favorites). Final design: format-colored gradient accent bar at top of each card, full-bleed format-tinted background, inline mana color pips next to title, larger `text-xl` prices, colored format/archetype tag pills, user avatar with location. Added 6 seed want lists across all 3 test users for testing. Preview pages cleaned up after finalizing. Pushed directly to main.
**Next:** Start M17 (Rate Limiting & Abuse Prevention).

### 2026-04-04 — Browse page redesign (frosted glass sidebar)

**Done:** Redesigned browse page (`/decks`). Explored 12 design variants via `/preview` pages, selected "Frosted Glass Sidebar + Info Bar Cards" (V1B2). New layout: sticky glass sidebar with all filters (quick chips, price range, province, city, format, commander, power level, color identity, archetype, sort), portrait 5:4 commander art cards with name overlaid and info bar below (avatar, username, location, price, format). New `BrowseSidebar` client component replaces old `BrowseFilters`. All filters fully functional and wired to URL params. Preview pages cleaned up.
**Next:** Start M17 (Rate Limiting & Abuse Prevention).

### 2026-04-04 — Hero page redesign (PR #14 merged)

**Done:** Redesigned landing page hero. Explored 8 design variants via `/preview` pages, selected "Layered Depth" style. Cinematic single commander art background with subtle blur, animated purple/blue gradient overlay, frosted glass CTA panel, three value prop cards with SVG icons (Track collection, Find local traders, Trade with confidence), 4-step "how it works" flow. Copy rewritten to focus on player value and local community. Preview pages cleaned up after finalizing.
**Next:** Start M17 (Rate Limiting & Abuse Prevention).

### 2026-04-03 — M16 Security Hardening (PR #13 merged)

**Done:** All 7 M16 items implemented on `m16-security-hardening` branch. Migration 020: RLS column restrictions on users (blocks trade_rating, completed_trades, reputation_score) and trades (blocks proposer_id, receiver_id changes), storage path validation for deck-photos. Security headers in next.config.ts (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). CRON_SECRET added to .env.example. Resend demo key removed from .env.development. UUID validation helper + checks on all 5 [id] page routes. Account deletion requires password for email users, "type DELETE" for OAuth users. Auth error messages generified with server-side logging. M14 marked complete (already done in M11).
**Next:** Commit changes, open PR, merge. Then M17 (Rate Limiting).

### 2026-04-03 — M13 Counter-Offers complete

**Done:** Counter-offer flow end-to-end. Migration 019 adds `last_counter_by` to trades, relaxes trade_decks RLS for counter-offers. `counterTrade()` service function replaces deck selections and updates status. Counter-offer form with They pay/You pay slider toggle, tooltip, bordered pill UI. Same cash slider added to propose trade form. Trade badge moved to client component (fetches on mount + tab focus) — counts both proposals and counter-offers. Trades list page enhanced: inline circular commander art, deck values, cash direction, relative time, message preview with muted background. Email notification for `countered` event with deck lists and message. Redirects to /trades after proposing or countering. Global cursor-pointer on all interactive elements. Third test user (trader) + seed decks added. Tooltip component installed (shadcn).
**Next:** Merge PR. Start M16 (Security Hardening).

### 2026-04-01 — Printing-accurate card prices (PR #11)

**Done:** Card prices now reflect specific printings. Migration 018 adds `collector_number` and `set_name` to `card_cache`. Text importer extracts `(SET) collector` instead of stripping it. New `resolveCardPrinting()` waterfall: exact printing → name+set → cheapest. Moxfield and Archidekt URL importers pass set codes through. New `PrintingSelector` component on deck edit page lets users change printing per card. Autocomplete deduplicates by oracle_id. Seed data updated with testuser + two decks. All 37 tests pass.
**Next:** Merge PR #11. Run migration 018 on production Supabase, then re-sync card cache to backfill new columns.

### 2026-04-01 — Production deployment + Google OAuth

**Done:** Deployed DeckShark to Vercel at deckshark.gg. Bought domain via GoDaddy, configured DNS (A record + CNAME for www). Created Vercel project, linked to GitHub repo (made repo public for Hobby plan). Set all env vars for production and preview environments. Ran all 17 migrations against production Supabase. Added Google OAuth — `signInWithGoogle()` in auth service, Google buttons on login/register forms. Configured Google Cloud OAuth credentials and Supabase Google provider. Set up Supabase Auth redirect URLs for production and preview deployments. PR #10 merged.
**Next:** Start M11 (Counter-Offers) on new branch. Optionally: sync card cache on production (hit `/api/cron/sync-cards`), set up Resend domain verification for email deliverability.

### 2026-03-31 — iOS hamburger debugging (unresolved)

**Done:** Tried every approach to fix hamburger menu on iPhone Chrome: Radix Sheet → plain button → anchor tag → `<button type="button">` with `touch-action: manipulation` → native `touchstart` addEventListener via ref bypassing React delegation. None worked. Left with native touchstart + dedup guard in place. Need to use Chrome remote DevTools (`chrome://inspect`) to identify what element is actually receiving taps on the right side of the header.
**Next:** When resuming, use `chrome://inspect` on the laptop while the phone loads the dev server to inspect elements and check for invisible overlays. Also consider temporarily removing `UserMenu` from header to test if Radix DropdownMenu is the culprit.

### 2026-03-31 — Header polish + PR opened

**Done:** Added DeckShark shark logo (`public/logo.png`) to header alongside text. Added `HeaderSearch` client component — searches deck name OR commander name via `/decks?q=`, hidden on mobile. Extended `getPublicDecks` with `q` filter (Postgres `or()` on name + commander_name). Removed emoji icons from landing page value props. PR #9 opened for m10.5 → main.
**Next:** Merge PR #9, start M11 (Counter-Offers) on new branch.

### 2026-03-31 — M10.5 complete

**Done:** All browse filter enhancements: power level + color identity on decks (migration 017, deck forms), `ColorIdentitySelector` replaced with grouped dropdown (31 color identity options mono→5-color), collapsible filter panel (quick chips + price + location always visible, More/Hide filters toggle), city autocomplete (`/api/cities/search`), commander autocomplete (`/api/commanders/search`), profile city/province auto-applied on first browse visit, DeckShark.gg rebrand in header with `text-primary` .gg. Branch pushed.
**Deferred:** Distance radius filter — no lat/lng in DB; see DECISIONS.md.
**Next:** Open PR for m10.5 → main, then start M11 (Counter-Offers) on new branch.

### 2026-03-30 — M10 Polish & Mobile complete

**Done:** Sleeves/deckbox checkboxes on deck listing (migration 016, deck form/edit-form, public deck card + detail). Loading skeletons for deck browse, dashboard, trades, want-lists. `error.tsx` boundaries in (public) and (protected) route groups. Pagination on /decks, /want-lists, and /trades. Rate limiting on `/api/import/url` and `/api/notify/want-list-match`. Account deletion + data export (`/api/account/delete`, `/api/account/export`, `AccountDangerZone` component on settings page). Connected MobileNav in Header (was never wired up). Flex-wrap fixes on trade/want-list detail headers. Aria-labels on icon-only buttons. SVG favicon + PWA manifest with dark theme_color.
**Next:** Open PR for `m10-polish-mobile` → main, then start M11 (Counter-Offers) on new branch `m11-counter-offers`.

### 2026-03-27 — Deck details in trade notification emails

**Done:** Extended `/api/notify/trade` query to join `trade_decks(offered_by, deck:decks(name, commander_name, format))`. Partition rows by `offered_by` to get `proposerDecks` / `receiverDecks` arrays. Added `deckList()` HTML helper in `email.ts`. Updated `sendTradeProposedEmail` ("They're offering:" / "In exchange for:"), `sendTradeAcceptedEmail` ("You're giving:" / "You're receiving:"), and `sendTradeCompletedEmail` ("You gave:" / "You received:"). `sendTradeDeclinedEmail` left minimal. All params are optional with `[]` defaults so existing callers without deck data won't break.
**Next:** Continue M8 Email Notifications (want-list match emails, if remaining) or begin M9 Onboarding & Landing Page

### 2026-03-26 — Archetype field on decks + polish

**Done:** `014_deck_archetype.sql` adds `archetype text` to `decks`. `Deck` type updated. `createDeck`/`updateDeck` services accept `archetype`. Archetype Select added to `deck-form.tsx` and `deck-edit-form.tsx` (Radix sentinel `"none"` pattern for empty option; `max-h-72` on SelectContent to prevent overflow). Archetype displayed on browse card and deck detail sidebar. `getMatchingDecks` now filters by archetype when set on want list.
**Next:** M8 Email Notifications

### 2026-03-27 — M9 Landing page, enhanced onboarding, OG metadata

**Done:** Landing page at `/` with hero, 3 value props, live featured decks grid (6 most recent), and bottom CTA. Enhanced onboarding — after username/city/province step, users are routed to `/decks/new?onboarding=true` which shows a welcome banner with a skip link. OG/meta `generateMetadata` added to deck detail and profile pages. `getPublicDecks` now accepts optional `limit` param. Google OAuth deferred.
**Next:** M10 Polish & Mobile, or open PR for M9.

### 2026-03-27 — M7 Want Lists complete

**Done:** `012_want_lists.sql` (want_lists table, RLS, updated_at trigger). WantList type updated with format field. Client service (wantlists.ts): createWantList, updateWantList, deleteWantList. Server service (wantlists.server.ts): getUserWantLists, getWantList, getPublicWantLists, getMatchingDecks. WantListForm component (title, format, commander, value range, description). Public browse at /want-lists. Want list detail at /want-lists/[id] with live matching decks. Create/edit pages. Dashboard updated with want lists section. Want Lists nav link in header.
**Next:** M8 Email Notifications

### 2026-03-26 — M6 Reviews & Reputation complete

**Done:** `011_reviews.sql` (reviews table, RLS, `handle_review_created` trigger updates `trade_rating`; `handle_trade_completed` extended to increment `completed_trades`). `reviews.ts` client service. `reviews.server.ts` with `getReviewsForUser` + `getTradeReview`. `ReviewForm` component (star rating + comment). Review prompt on trade detail page (shows form if not yet reviewed, shows submitted review if already done). Reviews section on public profile with avg rating. Fixed RLS (migration 010) so trade participants can read decks post-transfer. Fixed `trade_decks` insert RLS (migration 006). Ownership transfer on completion (migration 009). Receiver message feature. Notification badge on Trades nav link.
**Next:** M7 Want Lists

### 2026-03-26 — M5 Trading complete

**Done:** `005_trades.sql` migration (trades + trade_decks tables, RLS, status check constraint). Types updated (TradeStatus, Trade, TradeDeck). Client service (`trades.ts`) with proposeTrade, acceptTrade, declineTrade, cancelTrade, completeTrade, shareContact. Server service (`trades.server.ts`) with full joins. ProposeTradeForm component. TradeActions client component (Accept/Decline/Cancel/Complete + PIPEDA contact sharing). "Propose trade" button on public deck detail page. New trade page (`/trades/new`). Trade detail page (`/trades/[id]`). Trades inbox (`/trades`) with Active/Past split. "Trades" link added to header nav. Type-check passes clean.
**Next:** Optional: add Supabase Realtime subscription for live trade status in detail page. Otherwise begin M6 Reviews or M7 Want Lists.

### 2026-03-26 — M4 Complete

**Done:** URL importers for Moxfield and Archidekt (server-side fetch → ParseResult). Single `/api/import/url` route auto-detects platform. URL fetch field added to both create and edit deck forms.
**Next:** Begin M5 — trades migration, proposal flow.

### 2026-03-26 — M4 Public Browsing (core)

**Done:** Migration 004 (available_for_trade column + RLS update). Public browse page (/decks) with format/province/city/commander/value filters via URL search params. Public deck detail page (/decks/[id]) with decklist, photo, owner sidebar. Available-for-trade toggle on dashboard (optimistic UI). Enhanced public profile with trade-available decks. Browse link in header nav. next.config.ts image remote patterns for Supabase storage.
**Next:** URL importers (moxfield.ts, archidekt.ts), then open PR.

### 2026-03-21 — Unit tests + CI

**Done:** Vitest setup, 28 unit tests (text importer, Scryfall helpers, onboarding logic), CI updated with test step. Push blocked by GitHub token missing `workflow` scope — run `gh auth refresh -h github.com -s workflow` then `git push origin main`.
**Next:** Push pending commits. Begin M4 (Public Browsing).

### 2026-03-21 — M3 Deck Management (Phase A core)

**Done:** 003_decks.sql migration (decks, deck_cards, deck_photos with RLS, storage bucket). Deck service (full CRUD, cards, photos, value calculation). Text decklist importer. Storage service. Dashboard with deck grid. Create deck page with text import. Edit deck page (details, add/remove cards, re-import, photo upload, delete). Deck display components (grid, card list, stats, header). Format constants.
**Next:** Begin M4 — Public browsing, filters, URL importers.

### 2026-03-21 — M2 Card Data Infrastructure

**Done:** 002_card_cache.sql migration (trigram index, public read RLS). Scryfall API wrapper (autocomplete, search, named, collection, bulk data). Cards service (searchCards, getCardByName, getCardsByIds, getCardPrice). Sync cron route with Vercel cron config (daily 6 AM UTC). Card autocomplete component. Local card cache populated with 109k cards.
**Next:** Begin M3 — Deck Management (Phase A core).

### 2026-03-21 — M1 Auth & User Profiles (core)

**Done:** 001_users.sql migration, auth services (email/password), login/register pages, onboarding flow (username, city, province), settings page, public profile page, privacy policy, header with auth-aware nav, middleware route protection fix, local dev environment (.env.development), shadcn/ui components. Separate server/client user services to work with Next.js App Router.
**Next:** Add Google OAuth support, then begin M2 (Card Data Infrastructure).

### 2026-03-21 — M0 Complete: Infra setup

**Done:** Supabase projects created, Vercel linked, GitHub repo transferred to `decktrader` org.
**Next:** Begin M1 — write `001_users.sql` migration.

### 2026-03-20 — M0 Project Scaffolding

**Done:** Next.js 16 app with App Router, TypeScript, Tailwind v4, shadcn/ui, Supabase SSR client stubs, service layer stubs, shared types, Supabase CLI init, .env.example, GitHub Actions CI, Husky + lint-staged pre-commit hooks, Prettier config.
**Next:** Create Supabase projects (staging + production) and link Vercel, then begin M1 (auth + user profiles).
