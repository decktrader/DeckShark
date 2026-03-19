# DeckTrader — MTG Deck Exchange

## Project Overview
MTG deck trading marketplace. Canada-first, in-person trades.
Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase + Vercel.

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

### File & Naming Conventions
- Files: kebab-case (`deck-card-grid.tsx`)
- Components: PascalCase (`DeckCardGrid`)
- Types: `src/types/`
- DB-generated types: `src/types/database.ts` (via `supabase gen types typescript`)

### Data Conventions
- Prices stored as integers (cents), displayed as formatted USD
- Card data sourced from Scryfall, cached in `card_cache` table

## Commands
- `pnpm dev` — local dev server
- `pnpm build` — production build (must pass with zero errors before PR)
- `pnpm lint` — ESLint
- `pnpm format` — Prettier
- `pnpm format:check` — Prettier check (CI)
- `pnpm type-check` — TypeScript compiler check

## Git & Commit Conventions
- NEVER include "Co-Authored-By" lines in commits
- Commit messages: concise, explain WHY and WHAT changed
- Keep commits minimal — do not batch unrelated changes
- Always use git worktrees when working on changes
- Feature branches off `main`, PR to merge
- One migration owner at a time — announce before writing migrations
- CI runs lint + type-check + format check on every PR

## Formatting & Linting
- Prettier for all formatting (TypeScript, JSX, CSS, JSON, markdown)
- prettier-plugin-tailwindcss for consistent Tailwind class ordering
- ESLint with Next.js config for catching bugs
- Husky + lint-staged runs Prettier and ESLint on every commit automatically
- Do not argue about formatting — Prettier decides

## Supabase
- RLS on every table — no exceptions
- Migrations in `supabase/migrations/`, numbered sequentially
- Use Supabase Auth (email + Google OAuth)
- Storage for deck photos (`deck-photos` bucket)
