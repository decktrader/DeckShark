# DeckTrader

MTG deck trading marketplace. Canada-first, in-person trades.

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Vercel

## Local Dev Setup

Requires: Node.js, pnpm, Docker

```sh
pnpm install
supabase start           # starts local Postgres, Auth, Studio (Docker)
supabase db reset        # applies migrations
pnpm dev                 # http://localhost:3000
```

After first setup, populate the card database (~2 min):

```
curl http://localhost:3000/api/cron/sync-cards
```

Re-run this after every `supabase db reset` since it wipes local data.

## Commands

| Command           | Description               |
| ----------------- | ------------------------- |
| `pnpm dev`        | Local dev server          |
| `pnpm build`      | Production build          |
| `pnpm test`       | Run unit tests (Vitest)   |
| `pnpm lint`       | ESLint                    |
| `pnpm format`     | Prettier                  |
| `pnpm type-check` | TypeScript compiler check |

## Project Structure

```
src/
  app/              Route groups: (auth), (protected), (public)
  components/       UI components (auth, deck, profile, ui)
  lib/
    services/       Data access layer (never import supabase directly)
    supabase/       Supabase client setup (server, client, middleware)
    scryfall/       Scryfall API wrapper
    importers/      Decklist importers (text paste)
  types/            Shared TypeScript types
supabase/
  migrations/       Sequential SQL migrations
```

## Environment Files

- `.env.development` — local Supabase credentials (committed)
- `.env.production.local` — real Supabase credentials (gitignored)
- Vercel env vars handle production deploys
