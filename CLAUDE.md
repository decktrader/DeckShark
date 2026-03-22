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
- CI runs lint + type-check + format check on every PR

### Worktree Management (Claude handles this — users should not need to run git commands)

Claude manages all git operations: branching, committing, pushing, PRs, and worktrees.
Users just describe what they want done.

**Worktree location:** `../decktrader-worktrees/<branch-name>/`
(Sibling to the main repo directory)

**Workflow for any code change:**

1. Create a feature branch and worktree:
   ```
   git worktree add ../decktrader-worktrees/<branch-name> -b <branch-name>
   ```
2. Do all work inside the worktree directory
3. Commit, push, and create PR from the worktree
4. After PR is merged, clean up:
   ```
   git worktree remove ../decktrader-worktrees/<branch-name>
   ```

**Rules:**

- Branch names: kebab-case, descriptive (e.g., `add-deck-list-page`, `fix-auth-redirect`)
- One worktree per feature branch
- Clean up worktrees after the PR is merged or abandoned
- If a worktree already exists for a branch, reuse it — don't recreate

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
