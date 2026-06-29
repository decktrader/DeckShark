# DeckTrader — Decision Log

Architectural and implementation decisions made during development. Newest first.

<!-- Format:
## YYYY-MM-DD — Short title
**Context:** Why the decision came up
**Decision:** What we chose
**Alternatives considered:** What else we looked at
**Rationale:** Why this option won
-->

## 2026-06-29 — Visual redesign: repoint shadcn tokens; data-dependent sections deferred

**Context:** Full presentation-layer reskin to the "Convention Floor" theme (warm paper + midnight navy) from the `design-redesign/` handoff, with a hard constraint: change only the presentation layer, no routing/data/Supabase/server-logic edits.
**Decisions:**

- **Token strategy:** repointed the existing shadcn semantic tokens (`--background`, `--primary`, `--card`, `--border`, `--radius`, etc.) to the DeckShark palette in `globals.css` rather than adding a parallel token system. This flips the whole app to the new theme at once (every component inherits it) and avoids two competing systems. Also exposed DeckShark-specific utilities (`bg-navy`, `text-terra`, `rounded-pill`, `shadow-panel`, ...) via `@theme`. Tailwind v4 is CSS-first (no `tailwind.config.*`).
- **Watch vs shipping-vote:** kept `deck_interests` as the "Want this shipped?" shipping vote (its real meaning) and did NOT relabel it "Watch" per the mocks. A real Watch/favourite is a separate, net-new feature (own table/RLS/service) — backlogged.
- **Real signals only:** mock sections requiring aggregate/view-tracking/trader-directory data that no service provides (want-list most-wanted aggregate + filters, Market Pulse demand/supply + Most Viewed + week toggle, Active Traders directory, Profile earnable badges) were built from real data where possible (e.g. `/pulse` and `/community` use `getHeroCities`/`getHeroStats`/interest counts) and otherwise omitted + backlogged. No invented metrics, no fabricated timeframes.
- **New routes:** `/community` and `/pulse` added (routing + nav). Old map-based hero (`components/hero/*`) and `deck-browse-card.tsx` deleted as dead code after Browse/Home rebuilds.
  **Alternatives considered:** parallel DeckShark token layer with per-page migration (more code, two systems); relabeling interest as Watch (would conflate two distinct product concepts).
  **Rationale:** Repointing tokens is the least-code, most-consistent way to reskin a token-driven app. Deferring data-dependent sections keeps the reskin strictly presentation-only and avoids shipping invented metrics. Rollback safety: tag `pre-redesign-2026-06-29` + branch `pre-redesign-snapshot`.

## 2026-05-15 — No automated emails from matching features — in-app only

**Context:** Trade matching went live and immediately email-blasted a user with 30+ emails (one per match per deck). Even after fixing to one email per user, the principle is wrong — automated matching should never generate emails.
**Decision:** Trade match notifications are in-app only (dashboard + notification bell). No emails. This applies to any future automated matching/suggestion features too.
**Rule:** Never send automated emails from features that run without explicit user action. Emails are only acceptable for: (1) direct user-to-user events (trade proposed, accepted, etc.), (2) opt-in digests on a schedule (weekly value update), (3) auth flows. If in doubt, make it in-app only.
**Rationale:** Users will abandon the platform if they feel spammed. One bad email blast can destroy trust permanently. In-app notifications are low-friction — users see them when they choose to visit. Emails interrupt their day.

## 2026-04-17 — Country/state/province: reuse `province` column for US states

**Context:** Expanding from Canada-only to Canada + US. Need to store US state codes alongside Canadian province codes.
**Decision:** Added `country` column (check constraint: 'CA' or 'US'). Reuse `province` column for both CA provinces and US states. Disambiguate by country when filtering.
**Alternatives considered:** Separate `state` column for US, or a generic `region` column rename.
**Rationale:** Province column is referenced in 30+ places. Renaming would be massive churn. The country field provides disambiguation. State/province codes don't overlap in practice (except 'CA' for California, which is fine since country field distinguishes it).

## 2026-04-08 — Switch dev server from Turbopack to Webpack

**Context:** Dev server (`pnpm dev`) froze the machine 3 times in a row. Docker showed Supabase containers were fine (~2% CPU). Turbopack was spiking all 8 CPU cores during initial compilation on a 16GB Mac, with Docker already consuming ~2GB for Supabase.
**Decision:** Changed dev script to `next dev --webpack` with `NODE_OPTIONS='--max-old-space-size=4096'` memory cap.
**Alternatives considered:** CPU cgroup limits (not practical on macOS), reducing Supabase containers, downgrading Next.js.
**Rationale:** Webpack uses significantly less CPU than Turbopack. The memory cap prevents Node heap from ballooning. HMR is slightly slower but the system stays responsive. Can revisit Turbopack when the project moves to a beefier machine or Turbopack's resource usage improves.

## 2026-03-30 — Distance radius filter deferred to future milestone

**Context:** M10.5 browse filter additions included a distance radius filter (10/25/50/100 km, Anywhere). The `users` table stores `city` and `province` text only — no lat/lng coordinates.
**Decision:** Defer distance filtering. Noted in PLAN.md as a potential M12.5 feature.
**Alternatives considered:** Geocode city+province to lat/lng on user save (requires external geocoding API, cost, accuracy issues); add lat/lng columns and populate via geocoding.
**Rationale:** Requires geocoding service integration, new DB columns, and non-trivial UI. Not worth the complexity for the current user base size. City + province filters cover the use case adequately for now.

## 2026-03-30 — Color identity stored as text[] column on decks (M10.5)

**Context:** Color identity filter was deferred in M4. M10.5 implements it.
**Decision:** Added `color_identity text[]` column to `decks`. Users set it manually in the deck form (checkboxes for W/U/B/R/G). Filter uses Postgres `@>` (contains) operator — selecting W+U shows decks whose identity includes both.
**Alternatives considered:** Auto-derive from commander via card_cache join; RPC function. Auto-derive is a nice enhancement but adds form complexity. Manual entry is sufficient for MVP.
**Rationale:** Stored column allows efficient PostgREST filtering. Manual entry keeps the form flow simple. Auto-derive from commander can be added as a follow-up.

## 2026-03-26 — Color identity filter deferred from M4

**Context:** PLAN.md listed color identity as an M4 browse filter. The `decks` table has no `color_identity` column, and `commander_scryfall_id` has no FK to `card_cache`, so PostgREST can't join them for filtering.
**Decision:** Defer color identity filter. The remaining filters (format, province, city, commander name, value range) provide a functional browse experience for launch.
**Alternatives considered:** Add `color_identity text[]` column to `decks` (populated from card_cache on deck save); RPC function; client-side post-filter after fetching all decks.
**Rationale:** Adding a stored column requires updating deck create/edit logic and is a larger change than M4 warrants. Can be added in M10 polish or as a standalone follow-up.

## 2026-03-21 — Use `.env.production.local` for real Supabase credentials

**Context:** `.env.local` overrides `.env.development`, causing local dev to hit real Supabase instead of local.
**Decision:** Remove `.env.local`. Use `.env.development` (committed) for local Supabase and `.env.production.local` (gitignored) for real credentials. Vercel env vars handle production deploys.
**Alternatives considered:** Maintaining both `.env.local` and `.env.development` manually.
**Rationale:** Eliminates env file conflicts. `pnpm dev` always uses local Supabase with no manual switching.

## 2026-03-21 — Separate server/client user services

**Context:** `users.ts` imported `@/lib/supabase/server` (which uses `next/headers`), but client components also import from `users.ts`. Next.js Turbopack fails when `next/headers` leaks into client bundles.
**Decision:** Split into `users.ts` (browser client, safe for client components) and `users.server.ts` (server client, for server components/routes).
**Alternatives considered:** Single service with dynamic imports, barrel file with `'use server'` directive.
**Rationale:** Explicit split is simplest and avoids runtime import tricks. Server components import from `users.server.ts`, client components from `users.ts`. `isOnboardingComplete` is a pure function in `users.ts`, safe for both.

## 2026-03-21 — Use `.env.development` for local Supabase

**Context:** Need shared local dev credentials (Supabase demo keys) committed to repo, but `.env.local` is gitignored and holds real credentials.
**Decision:** Use `.env.development` for local Supabase keys. Next.js loads it in dev mode; `.env.local` overrides if present.
**Alternatives considered:** Remove `.env.development.local` from `.gitignore`, use a custom env loader.
**Rationale:** `.env.development` is not gitignored by default in Next.js, and local Supabase demo keys are safe to commit. Clean separation: `.env.development` = local dev, `.env.local` = real credentials.

## 2026-03-21 — Move repo to `decktrader` GitHub org

**Context:** Repo was under `nikosmeds/decktrader` — single-owner risk for a two-person team.
**Decision:** Created `decktrader` org, transferred repo to `decktrader/decktrader`.
**Alternatives considered:** Keep under personal account, use a different org name.
**Rationale:** Shared ownership, easier team permissions, better to do early before integrations accumulate. GitHub redirects old URLs automatically.
