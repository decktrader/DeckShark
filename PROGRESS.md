# DeckTrader — Progress Tracker

## Current Focus

**Milestone:** M3 — Deck Management
**Status:** Not started
**Next step:** Begin M3 — deck CRUD, importers, dashboard

---

## Milestone Status

| Milestone                     | Status           | Notes                       |
| ----------------------------- | ---------------- | --------------------------- |
| M0: Project Scaffolding       | Complete         |                             |
| M1: Auth & User Profiles      | Complete         | Google OAuth deferred to M9 |
| M2: Card Data Infrastructure  | Complete         |                             |
| M3: Deck Management (Phase A) | Not started      | Phase A ships after this    |
| M4: Public Browsing           | Blocked by M3    |                             |
| M5: Trading (Phase B)         | Blocked by M4    |                             |
| M6: Reviews & Reputation      | Blocked by M5    |                             |
| M7: Want Lists                | Blocked by M3    | Can run parallel with M5-M6 |
| M8: Email Notifications       | Blocked by M5+M7 |                             |
| M9: Onboarding & Landing Page | Blocked by M3    |                             |
| M10: Polish & Mobile          | Blocked by all   |                             |

## Recent Changes

<!-- Newest entries at the top. One entry per work session. -->

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
