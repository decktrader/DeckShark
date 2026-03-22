# DeckTrader — Decision Log

Architectural and implementation decisions made during development. Newest first.

<!-- Format:
## YYYY-MM-DD — Short title
**Context:** Why the decision came up
**Decision:** What we chose
**Alternatives considered:** What else we looked at
**Rationale:** Why this option won
-->

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
