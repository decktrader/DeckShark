# DeckTrader — Progress Tracker

## Current Focus

**Milestone:** M7 — Want Lists
**Status:** Complete
**Next step:** M8 Email Notifications (depends on M5+M7, now both done)

---

## Milestone Status

| Milestone                     | Status           | Notes                                 |
| ----------------------------- | ---------------- | ------------------------------------- |
| M0: Project Scaffolding       | Complete         |                                       |
| M1: Auth & User Profiles      | Complete         | Google OAuth deferred to M9           |
| M2: Card Data Infrastructure  | Complete         |                                       |
| M3: Deck Management (Phase A) | Complete         | Text import only, URL importers in M4 |
| M4: Public Browsing           | Complete         |                                       |
| M5: Trading (Phase B)         | Complete         | Realtime updates optional polish      |
| M6: Reviews & Reputation      | Complete         |                                       |
| M7: Want Lists                | Complete         |                                       |
| M8: Email Notifications       | Blocked by M5+M7 |                                       |
| M9: Onboarding & Landing Page | Blocked by M3    |                                       |
| M10: Polish & Mobile          | Blocked by all   |                                       |

## Recent Changes

<!-- Newest entries at the top. One entry per work session. -->

### 2026-03-26 — Archetype field on decks + polish

**Done:** `014_deck_archetype.sql` adds `archetype text` to `decks`. `Deck` type updated. `createDeck`/`updateDeck` services accept `archetype`. Archetype Select added to `deck-form.tsx` and `deck-edit-form.tsx` (Radix sentinel `"none"` pattern for empty option; `max-h-72` on SelectContent to prevent overflow). Archetype displayed on browse card and deck detail sidebar. `getMatchingDecks` now filters by archetype when set on want list.
**Next:** M8 Email Notifications

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
