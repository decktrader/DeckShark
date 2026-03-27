# DeckTrader — MTG Deck Exchange

## Project Overview

MTG deck trading marketplace. Canada-first, in-person trades.
Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase + Vercel.
Repo: `github.com/decktrader/decktrader`

## Progress Tracking (MANDATORY)

**At the start of every conversation:** Read PROGRESS.md, DECISIONS.md, and PLAN.md.

**Before ending any work session, you MUST:**

1. Update PROGRESS.md:
   - Set "Current Focus" to reflect where things stand now
   - Update the milestone status table if anything changed
   - Add an entry to "Recent Changes" with: date, what was done, what's next
2. Update DECISIONS.md if any non-obvious technical choices were made
3. These updates are NOT optional. Do them even if the user doesn't ask.

**If the user says "continue":** Read the tracking files, pick up from where
"Next step" left off, and keep going. No need to ask what to do.

## Architecture

### Route Groups

- `(auth)/` — login, register (unauthenticated only)
- `(public)/` — browsable without login (decks, profiles, want lists)
- `(protected)/` — requires auth (dashboard, settings, trades)

### Service Layer Pattern

Components NEVER import from `@/lib/supabase/*` directly.
All data access goes through `@/lib/services/*`.
Service functions return `{ data, error }` pattern.
Server components use `*.server.ts` service files; client components use the base service files.
This avoids `next/headers` leaking into client bundles.
Exception: cron routes and admin operations can import `createClient` from `@supabase/supabase-js` directly with the service role key to bypass RLS.

### File & Naming Conventions

- Files: kebab-case (`deck-card-grid.tsx`)
- Components: PascalCase (`DeckCardGrid`)
- Types: `src/types/`
- DB-generated types: `src/types/database.ts` (via `supabase gen types typescript`)

### Data Conventions

- Prices stored as integers (cents), displayed as formatted USD
- Card data sourced from Scryfall, cached in `card_cache` table

## Local Dev

- `supabase start` — starts local Postgres, Auth, Studio, Inbucket (requires Docker)
- `supabase stop` → `supabase start` — **safe restart, data is preserved** (Docker volumes intact)
- `supabase db reset` — ⚠️ **wipes all data**, re-runs migrations + seed.sql. Use only intentionally.
- `.env.development` — local Supabase credentials (committed, shared)
- `.env.development` includes `SUPABASE_SERVICE_ROLE_KEY` (local demo key) for server-side operations that bypass RLS (e.g., cron sync)
- `.env.production.local` — real Supabase credentials (gitignored, personal)
- Vercel env vars handle production deploys — no need to commit real credentials
- Local Studio: http://127.0.0.1:54323
- Local Inbucket (email testing): http://127.0.0.1:54324
- `supabase db reset` wipes all local data — re-sync cards afterward

### New developer setup

1. `pnpm install`
2. `supabase start` (Docker must be running)
3. `supabase db reset`
4. `pnpm dev`
5. Hit `http://localhost:3000/api/cron/sync-cards` once to populate cards (~2 min)

### GitHub CLI

- Install: `brew install gh` then `gh auth login`
- Token must include `workflow` scope to push CI changes
- If push fails with "refusing to allow a Personal Access Token to create or update workflow":
  `gh auth refresh -h github.com -s workflow` then `gh auth setup-git`

## Commands

- `pnpm dev` — local dev server
- `pnpm build` — production build (must pass with zero errors before PR)
- `pnpm lint` — ESLint
- `pnpm format` — Prettier
- `pnpm format:check` — Prettier check (CI)
- `pnpm test` — run unit tests (Vitest)
- `pnpm test:watch` — run tests in watch mode
- `pnpm type-check` — TypeScript compiler check

## Testing

- Vitest for unit tests, test files in `__tests__/` directories alongside source
- Test pure functions and helpers (importers, price formatting, onboarding logic)
- Run `pnpm test` before committing — CI will catch failures

## Team Workflow

- Two developers, both using Claude Code, sometimes async, sometimes sync
- Divide work by domain/feature (full-stack slices), not by layer (frontend/backend)
- Define DB schema and service layer interfaces early (shared contracts)
- Vercel preview deploys per PR for visibility

## Git & Commit Conventions

- NEVER include "Co-Authored-By" lines in commits
- NEVER add "Generated with Claude Code" or similar attribution to PR descriptions
- Commit messages: concise, explain WHY and WHAT changed
- Keep commits minimal — do not batch unrelated changes
- Direct commits to `main` are fine for straightforward changes
- Feature branches + PRs for larger or riskier changes
- One migration owner at a time — announce before writing migrations
- CI runs lint + type-check + format check + tests on every PR

### Branching

Claude manages all git operations: branching, committing, pushing, PRs.
Users just describe what they want done.

- Branch names: kebab-case, descriptive (e.g., `add-deck-list-page`, `fix-auth-redirect`)
- Use feature branches for larger or riskier changes
- Worktrees optional for parallel work across branches (`../decktrader-worktrees/<branch-name>/`)

## Formatting & Linting

- Prettier for all formatting (TypeScript, JSX, CSS, JSON, markdown)
- prettier-plugin-tailwindcss for consistent Tailwind class ordering
- ESLint with Next.js config for catching bugs
- Husky + lint-staged runs Prettier and ESLint on every commit automatically
- Do not argue about formatting — Prettier decides

## Supabase

- RLS on every table — no exceptions
- Migrations in `supabase/migrations/`, numbered sequentially
- Use Supabase Auth (email for now — Google OAuth deferred to M9)
- Storage for deck photos (`deck-photos` bucket)
