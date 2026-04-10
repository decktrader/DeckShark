# DeckTrader — Progress Tracker

## Current Focus

**Milestone:** Full UI redesign pass — Complete
**Status:** Every page redesigned through iterative preview workflow. Partner commander support, bracket system, header redesign, notification bell all shipped.
**Next step:** M23 (Observability — Sentry, health check, analytics) → M17 (Rate Limiting) → M24 (Email Polish) → M18/M19 → M21/M22.
**Blocked:** iOS hamburger menu non-responsive on iPhone Chrome — root cause unknown; needs remote DevTools inspection.

---

## Milestone Status

| Milestone                       | Status   | Notes                                                                                                                                |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| M0: Project Scaffolding         | Complete |                                                                                                                                      |
| M1: Auth & User Profiles        | Complete | Google OAuth deferred to M9                                                                                                          |
| M2: Card Data Infrastructure    | Complete |                                                                                                                                      |
| M3: Deck Management (Phase A)   | Complete | Text import only, URL importers in M4                                                                                                |
| M4: Public Browsing             | Complete |                                                                                                                                      |
| M5: Trading (Phase B)           | Complete | Realtime updates optional polish                                                                                                     |
| M6: Reviews & Reputation        | Complete |                                                                                                                                      |
| M7: Want Lists                  | Complete |                                                                                                                                      |
| M8: Email Notifications         | Complete |                                                                                                                                      |
| M9: Onboarding & Landing Page   | Complete | Google OAuth deferred                                                                                                                |
| M10: Polish & Mobile            | Complete | Sleeves/deckbox, skeletons, error boundaries, pagination, rate-limit, account deletion/export, mobile nav, a11y, PWA                 |
| M11: Browse Filters             | Complete | Power level, color identity, archetype, sort, collapsible panel, city autocomplete, profile city default, DeckShark rebrand          |
| M12: Production Deploy          | Complete | deckshark.gg live on Vercel, Google OAuth, production Supabase migrations applied                                                    |
| M13: Counter-Offers             | Complete | Counter-offer form, cash slider, trade badge, enhanced trades list, email notifications                                              |
| M14: Color Identity Filter      | Complete | Implemented in M11 — ColorIdentitySelector, browse filter, server query with .contains()                                             |
| M15: Disputes                   | Deferred | Build when user base warrants                                                                                                        |
| **M16: Security Hardening**     | Complete | RLS column restrictions, security headers, account deletion confirmation, UUID validation, auth error generification. PR #13 merged. |
| **M17: Rate Limiting**          | Planned  | Upstash Redis rate limiting, abuse prevention on all routes, notification idempotency                                                |
| **M18: Performance & Caching**  | Planned  | DB pagination, ISR caching, browse indexes, image optimization, query optimization                                                   |
| **M19: Admin Portal**           | Planned  | Stats dashboard, user mgmt, trade oversight, moderation/reporting, feedback inbox, platform health. After M16-M18.                   |
| **M20: UX Overhaul**            | Complete | Browse-first landing page, onboarding redirects to /decks, city autocomplete on forms, public want-list detail with auth prompt      |
| **M21: Remote Interest Signal** | Planned  | "I'd trade for this" button, interest counts, owner notifications, demand data for shipping launch                                   |
| **M22: Notification System**    | Planned  | Centralized bell notifications, notifications table, dropdown inbox, replace scattered badge counts, notification preferences        |
| **M23: Observability**          | Planned  | Sentry error tracking, health check endpoint, Vercel Analytics, post-deploy smoke tests, build skip script. **Do first.**            |
| **M24: Email Polish**           | Planned  | Branded auth emails, re-engagement cron, HMAC unsubscribe, data export (PIPEDA)                                                      |
| Branch Protection               | Planned  | Protect main branch — require PRs, no direct pushes to production                                                                    |

## Recent Changes

<!-- Newest entries at the top. One entry per work session. -->

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
