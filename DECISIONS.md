# DeckTrader — Decision Log

Architectural and implementation decisions made during development. Newest first.

<!-- Format:
## YYYY-MM-DD — Short title
**Context:** Why the decision came up
**Decision:** What we chose
**Alternatives considered:** What else we looked at
**Rationale:** Why this option won
-->

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
