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
