# DeckTrader — Progress Tracker

## Current Focus

**Milestone:** M1 — Auth & User Profiles
**Status:** Not started
**Next step:** Write `001_users.sql` migration (users table, RLS, auto-create trigger)

---

## Milestone Status

| Milestone                     | Status           | Notes                       |
| ----------------------------- | ---------------- | --------------------------- |
| M0: Project Scaffolding       | Complete         |                             |
| M1: Auth & User Profiles      | Not started      |                             |
| M2: Card Data Infrastructure  | Not started      | Can run parallel with M1    |
| M3: Deck Management (Phase A) | Blocked by M1+M2 | Phase A ships after this    |
| M4: Public Browsing           | Blocked by M3    |                             |
| M5: Trading (Phase B)         | Blocked by M4    |                             |
| M6: Reviews & Reputation      | Blocked by M5    |                             |
| M7: Want Lists                | Blocked by M3    | Can run parallel with M5-M6 |
| M8: Email Notifications       | Blocked by M5+M7 |                             |
| M9: Onboarding & Landing Page | Blocked by M3    |                             |
| M10: Polish & Mobile          | Blocked by all   |                             |

## Recent Changes

<!-- Newest entries at the top. One entry per work session. -->

### 2026-03-21 — M0 Complete: Infra setup

**Done:** Supabase projects created, Vercel linked, GitHub repo transferred to `decktrader` org.
**Next:** Begin M1 — write `001_users.sql` migration.

### 2026-03-20 — M0 Project Scaffolding

**Done:** Next.js 16 app with App Router, TypeScript, Tailwind v4, shadcn/ui, Supabase SSR client stubs, service layer stubs, shared types, Supabase CLI init, .env.example, GitHub Actions CI, Husky + lint-staged pre-commit hooks, Prettier config.
**Next:** Create Supabase projects (staging + production) and link Vercel, then begin M1 (auth + user profiles).
