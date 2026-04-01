# DeckTrader — Progress Tracker

## Current Focus

**Milestone:** Production Deployment + Google OAuth
**Status:** Complete — deckshark.gg is live, Google OAuth working
**Next step:** Start M11 (Counter-Offers) on new branch
**Blocked:** iOS hamburger menu non-responsive on iPhone Chrome — root cause unknown; needs remote DevTools inspection.

---

## Milestone Status

| Milestone                     | Status   | Notes                                                                                                                       |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| M0: Project Scaffolding       | Complete |                                                                                                                             |
| M1: Auth & User Profiles      | Complete | Google OAuth deferred to M9                                                                                                 |
| M2: Card Data Infrastructure  | Complete |                                                                                                                             |
| M3: Deck Management (Phase A) | Complete | Text import only, URL importers in M4                                                                                       |
| M4: Public Browsing           | Complete |                                                                                                                             |
| M5: Trading (Phase B)         | Complete | Realtime updates optional polish                                                                                            |
| M6: Reviews & Reputation      | Complete |                                                                                                                             |
| M7: Want Lists                | Complete |                                                                                                                             |
| M8: Email Notifications       | Complete |                                                                                                                             |
| M9: Onboarding & Landing Page | Complete | Google OAuth deferred                                                                                                       |
| M10: Polish & Mobile          | Complete | Sleeves/deckbox, skeletons, error boundaries, pagination, rate-limit, account deletion/export, mobile nav, a11y, PWA        |
| M10.5: Browse Filters         | Complete | Power level, color identity, archetype, sort, collapsible panel, city autocomplete, profile city default, DeckShark rebrand |
| Production Deploy             | Complete | deckshark.gg live on Vercel, Google OAuth, production Supabase migrations applied                                           |
| M11: Counter-Offers           | Planned  | Next up                                                                                                                     |
| M12: Color Identity Filter    | Planned  |                                                                                                                             |
| M13: Disputes                 | Deferred | Build when user base warrants                                                                                               |

## Recent Changes

<!-- Newest entries at the top. One entry per work session. -->

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
