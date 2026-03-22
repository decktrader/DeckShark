# MTG Deck Exchange — Technical Spec & Architecture

## Overview

A web marketplace where Magic: The Gathering players trade complete decks. Initial focus: Commander (EDH) format, launching in Canada with in-person trades at local game stores.

## Product Strategy

### "Come for the tool, stay for the network"

The marketplace faces a classic cold-start problem: trading requires critical mass on both sides. To solve this, the platform launches as a **useful deck management tool first**, with trading layered on top.

**Phase A — Deck Manager (standalone value, no network needed)**:

- Import decks from Moxfield/Archidekt/text
- Track your collection of decks with card prices from Scryfall
- See total deck value, price changes over time
- Mark decks as "available for trade" when ready

**Phase B — Local Trading Marketplace (network effects kick in)**:

- Browse decks marked for trade near you
- Propose and negotiate trades
- Meet in person at a local game store (LGS) to exchange
- Reviews and reputation

This means a user gets value from the app on day 1 even if they're the only user. Trading becomes a natural extension once enough decks are listed.

### Launch Strategy

- **Canada first** — launch in Canada (single currency CAD, one regulatory environment, tight-knit Commander communities). Expand to USA in Phase 2.
- **City-by-city rollout** — saturate one Canadian city's Commander scene before expanding to the next. Critical mass in one area > thin spread across many.
- **In-person trades at LGS** — primary trade method is meeting at a local game store. Avoids shipping fraud/damage/cost, enables card condition verification on the spot, and builds on existing community hubs (FNM, Commander nights).
- Launch fee-free — no transaction fees until liquidity is proven
- Seed with want-lists: users can list decks they _want_ (by archetype/commander/colors), not just decks they have — makes thin supply less visible and enables matching

### Revenue (deferred)

- Transaction fees only after proving marketplace liquidity
- Premium listings, analytics, and subscription features in later phases
- No proprietary currency — all values in **USD** (international standard for MTG card pricing, consistent with Scryfall/TCGPlayer). No currency conversion needed. All price displays include a clear "USD" label so Canadian users are never confused (e.g. "$450 USD", not "$450").
- Lesson from PucaTrade's failure: never create synthetic value or proprietary currency.

---

## Tech Stack

| Layer               | Choice                                            | Rationale                                                                                                                                                     |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**       | Next.js 16 (App Router)                           | SSR, API routes, matches blueprint                                                                                                                            |
| **Styling**         | Tailwind CSS + shadcn/ui                          | Rapid UI development, consistent design system                                                                                                                |
| **Backend/DB**      | Supabase (PostgreSQL + Auth + Storage + Realtime) | Managed Postgres, built-in auth, file storage for deck photos, realtime for trade notifications                                                               |
| **Payments**        | Deferred (in-person for MVP)                      | Cash differences tracked but settled in person. Avoids money transmission and sales tax complexity. Stripe Connect in Phase 2 when shipping trades are added. |
| **Card Data**       | Scryfall API + bulk data                          | Free, no API key needed, comprehensive card data + images + USD prices. TCGPlayer API is closed to new developers.                                            |
| **Email**           | Resend (via Supabase Edge Functions)              | Transactional email notifications for trade events                                                                                                            |
| **Hosting**         | Vercel                                            | Native Next.js support, edge functions                                                                                                                        |
| **Package Manager** | pnpm                                              | Fast, disk-efficient                                                                                                                                          |

---

## Environments

Three environments ensure safe rollout of changes:

| Environment    | Next.js                                 | Supabase                                                          | URL                                            |
| -------------- | --------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| **Local Dev**  | `next dev` (hot reload)                 | Supabase CLI (local Postgres, Auth, Storage, Realtime via Docker) | `localhost:3000`                               |
| **Staging**    | Vercel Preview (auto-deploys per PR)    | Separate Supabase project (staging)                               | Vercel preview URLs / `staging.decktrader.app` |
| **Production** | Vercel Production (deploys from `main`) | Separate Supabase project (production)                            | `decktrader.app`                               |

### Environment Config

| File                     | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `.env.local`             | Local dev secrets (gitignored)                     |
| `.env.example`           | Template showing all required vars                 |
| `supabase/config.toml`   | Local Supabase CLI config                          |
| `supabase/migrations/`   | Versioned SQL migrations                           |
| `supabase/seed.sql`      | Local dev seed data                                |
| `.github/dependabot.yml` | Dependabot config for automated dependency updates |

Vercel environment variables are scoped per environment (Preview vs Production), each pointing to the corresponding Supabase project.

### Migration & Deploy Flow

```
Local dev (Supabase CLI + Docker)
  → supabase db diff → generate migration
    → Push to PR → Vercel preview deploy + staging Supabase migration
      → Merge to main → Vercel production deploy + production Supabase migration
```

---

## Database Schema (Supabase/PostgreSQL)

### Core Tables

```
users
├── id (uuid, PK, from Supabase Auth)
├── username (text, unique)
├── avatar_url (text)
├── bio (text)
├── city (text)                           # e.g. "Toronto", "Vancouver"
├── province (text)                       # e.g. "ON", "BC"
├── reputation_score (numeric, default 0)
├── completed_trades (int, default 0)
├── trade_rating (numeric, default 0)
├── created_at (timestamptz)
└── updated_at (timestamptz)

decks
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── name (text)
├── commander_name (text)
├── commander_scryfall_id (text)
├── format (text, default 'commander')
├── description (text)
├── estimated_value_cents (int)
├── condition_notes (text)
├── status (enum: 'active', 'in_trade', 'traded', 'unlisted', 'archived')
├── created_at (timestamptz)
└── updated_at (timestamptz)

deck_cards
├── id (uuid, PK)
├── deck_id (uuid, FK → decks)
├── card_name (text)
├── scryfall_id (text)
├── quantity (int, default 1)
├── is_commander (boolean, default false)
└── price_cents (int)

deck_photos
├── id (uuid, PK)
├── deck_id (uuid, FK → decks)
├── storage_path (text)
├── is_primary (boolean, default false)
└── created_at (timestamptz)

trades
├── id (uuid, PK)
├── proposer_id (uuid, FK → users)
├── receiver_id (uuid, FK → users)
├── status (enum: 'proposed', 'countered', 'accepted', 'declined', 'meetup_scheduled', 'completed', 'cancelled', 'disputed')
├── cash_difference_cents (int, default 0)
├── cash_payer_id (uuid, FK → users, nullable)
├── meetup_date (timestamptz, nullable)
├── message (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

trade_decks
├── id (uuid, PK)
├── trade_id (uuid, FK → trades)
├── deck_id (uuid, FK → decks)
├── offered_by (uuid, FK → users)
└── created_at (timestamptz)

reviews
├── id (uuid, PK)
├── trade_id (uuid, FK → trades)
├── reviewer_id (uuid, FK → users)
├── reviewee_id (uuid, FK → users)
├── rating (int, 1-5)
├── comment (text)
└── created_at (timestamptz)

card_cache
├── scryfall_id (text, PK)
├── oracle_id (text)
├── name (text)
├── mana_cost (text)
├── type_line (text)
├── color_identity (text[])
├── set_code (text)
├── image_uri_normal (text)
├── image_uri_small (text)
├── image_uri_art_crop (text)
├── image_uri_back_normal (text, nullable) # back face for transform/MDFC/split cards
├── image_uri_back_small (text, nullable)
├── price_usd_cents (int, nullable)
├── price_usd_foil_cents (int, nullable)
├── legalities (jsonb)                    # { commander: 'legal', modern: 'legal', ... }
├── updated_at (timestamptz)
└── created_at (timestamptz)

want_lists
├── id (uuid, PK)
├── user_id (uuid, FK → users)
├── title (text)                          # e.g. "Looking for Ur-Dragon deck"
├── commander_name (text, nullable)       # specific commander wanted
├── color_identity (text[], nullable)     # e.g. ['R','G','B']
├── min_value_cents (int, nullable)
├── max_value_cents (int, nullable)
├── description (text)                    # free-text description of what they want
├── status (enum: 'active', 'fulfilled')
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Database Indexes

Add these indexes in the migration that creates each table — not as an afterthought:

| Table         | Column(s)        | Type                    | Rationale                           |
| ------------- | ---------------- | ----------------------- | ----------------------------------- |
| `card_cache`  | `name`           | GIN trigram (`pg_trgm`) | Card search/autocomplete            |
| `card_cache`  | `oracle_id`      | btree                   | Grouping printings of the same card |
| `decks`       | `user_id`        | btree                   | Dashboard queries (my decks)        |
| `decks`       | `status`         | btree                   | Public browse (filter by 'active')  |
| `decks`       | `format, status` | composite btree         | Browse with format filter           |
| `deck_cards`  | `deck_id`        | btree                   | Loading a deck's card list          |
| `deck_cards`  | `scryfall_id`    | btree                   | Price update joins                  |
| `deck_photos` | `deck_id`        | btree                   | Loading a deck's photos             |
| `trades`      | `proposer_id`    | btree                   | My trades (as proposer)             |
| `trades`      | `receiver_id`    | btree                   | My trades (as receiver)             |
| `trades`      | `status`         | btree                   | Active trade queries                |
| `trade_decks` | `trade_id`       | btree                   | Loading trade details               |
| `reviews`     | `reviewee_id`    | btree                   | Profile reputation display          |
| `reviews`     | `trade_id`       | btree                   | Checking if trade has reviews       |
| `want_lists`  | `user_id`        | btree                   | Dashboard queries                   |
| `want_lists`  | `status`         | btree                   | Active want list browse             |

### Row-Level Security (RLS)

- Users can only edit their own profiles and decks
- Trade proposals visible to both parties only
- Reviews are publicly readable, writable only by trade participants

---

## Application Structure

```
decktrader/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (public)/            # Public pages (no auth required)
│   │   │   ├── decks/
│   │   │   │   ├── [id]/       # Deck detail (public)
│   │   │   │   └── page.tsx    # Browse decks (public)
│   │   │   ├── profile/
│   │   │   │   └── [username]/ # Public profile
│   │   │   ├── want-lists/     # Browse want-lists (public)
│   │   │   └── privacy/        # Privacy policy
│   │   ├── (protected)/         # Auth required
│   │   │   ├── dashboard/      # User's dashboard / my collection
│   │   │   ├── decks/
│   │   │   │   └── new/        # Create deck listing
│   │   │   ├── trades/
│   │   │   │   ├── [id]/       # Trade detail/negotiation
│   │   │   │   └── page.tsx    # My trades
│   │   │   ├── onboarding/     # First-time user setup flow
│   │   │   └── settings/      # Profile, notifications, privacy, delete account
│   │   ├── api/                # API routes
│   │   │   ├── cron/
│   │   │   │   └── sync-cards/ # Daily Scryfall bulk data sync
│   │   │   └── webhooks/       # Supabase DB webhooks → email notifications
│   │   ├── layout.tsx
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── deck/               # Deck-related components
│   │   ├── trade/              # Trade-related components
│   │   └── layout/             # Header, footer, nav
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── services/           # Data access layer (components import from here)
│   │   │   ├── auth.ts
│   │   │   ├── decks.ts
│   │   │   ├── trades.ts
│   │   │   ├── wantlists.ts
│   │   │   ├── reviews.ts
│   │   │   ├── storage.ts
│   │   │   └── cards.ts
│   │   ├── scryfall/
│   │   │   └── api.ts          # Scryfall API wrapper
│   │   ├── importers/
│   │   │   ├── moxfield.ts     # Moxfield deck import
│   │   │   └── archidekt.ts    # Archidekt deck import
│   │   └── utils.ts
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── seed.sql
├── public/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Key Pages & Features (MVP)

### 1. Landing Page

- Hero section explaining the concept
- Featured decks carousel
- CTA to sign up

### 2. Auth (Supabase Auth)

- **Public browsing** — landing page, browse decks, deck detail, user profiles, and want-lists are all viewable without an account
- Sign up required only for actions: list a deck, propose a trade, request photos, create a want-list, leave a review
- Email/password signup & login
- OAuth (Google — lowest friction, nearly universal)
- Discord OAuth deferred to post-MVP (nice-to-have community signal)
- Username selection on first login

### 3. Browse Decks

- Grid of deck cards with commander image (from Scryfall), name, value, condition
- **Location filter** — browse decks near you (same city, or within a radius)
- Filters: format, color identity, value range, commander
- Search by deck name or commander

### 4. Deck Detail

- Full decklist with card images/prices from Scryfall
- Deck photos uploaded by owner
- Estimated total value (sum of card prices)
- Owner profile snippet + reputation
- "Propose Trade" button

### 5. Create/Edit Deck Listing

- **Import from Moxfield** (most popular deckbuilder — critical for reducing listing friction)
- Import from Archidekt URL
- Paste/import decklist (MTGO text format: "1 Card Name")
- Manual card entry with Scryfall autocomplete
- Photo upload (Supabase Storage)
- Auto-price calculation via Scryfall (USD, from card_cache table)

### 6. Want List

- Create want-list entries describing decks you're looking for (by commander, colors, value range, description)
- Browse other users' want-lists to find matches for your available decks
- Get notified when a newly listed deck matches your want-list

### 7. Trade Proposal Flow (in-person focused)

1. Select which of your decks to offer
2. Optionally note a cash difference (settled in person)
3. Send proposal with message
4. Either party can **request additional photos** of specific cards (condition audit before meeting)
5. Receiver accepts/declines/counters
6. Both confirm → **contact info shared** (email required, phone optional) to coordinate meetup
7. Meet in person — agree on location offline, inspect cards, exchange decks, settle any cash difference
8. Both confirm trade complete in the app
9. Leave reviews

No in-app chat for MVP — structured trade messages (propose, counter, request photos, accept/decline) handle negotiation. Meetup coordination happens off-platform after contact info exchange. In-app chat is a Phase 2 candidate.

### 8. Dashboard / My Collection

- **All my decks** (not just trade-listed — this is the deck management tool)
- Deck values with price tracking
- Mark decks as "available for trade" / "unlisted"
- My want-list
- Active trades (proposed, in-progress)
- Trade history
- Notifications

### 9. User Profile

- Public profile with username, reputation, trade history
- Reviews from past trades (star rating + comments)

### 10. Onboarding

- Username → city/province → "Import your first deck" (Moxfield URL as happy path)
- Option to skip and browse first
- Post-import prompt to mark deck as "available for trade"

### 11. Privacy Policy

- Static page explaining data collection, usage, sharing, and deletion rights (PIPEDA compliance)

### 12. Settings

- Edit profile (username, bio, city, province)
- Notification preferences (email opt-in/out per notification type)
- Privacy: consent management, data export, account deletion

---

## Key Architectural Decisions

### Service Abstraction Layer

Components never import Supabase directly. Instead, a thin service layer (`src/lib/services/`) wraps all data access. This adds ~5% more code but enables:

- **K8s migration**: Swap service internals from Supabase SDK → REST/gRPC calls without touching components
- **Microservices extraction**: Services map to natural domain boundaries (auth, decks, trades, shipments, reviews)
- **Testability**: Easy to mock services in tests

```
src/lib/services/
├── auth.ts        # login(), logout(), getUser()
├── decks.ts       # getDecks(), createDeck(), getDeckById()
├── trades.ts      # proposeTrade(), acceptTrade()
├── wantlists.ts   # createWant(), getWantsNearby()
├── reviews.ts     # createReview(), getReviewsForUser()
├── storage.ts     # uploadPhoto(), getPhotoUrl()
└── cards.ts       # searchCards(), getCardPrice()
```

RLS still enforces security at the database level. API routes only needed for: Scryfall data caching, external imports (Moxfield/Archidekt), and server-side logic.

### Card data & pricing (Scryfall)

Scryfall is the only viable option — TCGPlayer's API is closed to new developers. All prices shown in **USD** (the international standard for MTG pricing, sourced from TCGPlayer via Scryfall).

**Caching strategy** (critical — Scryfall is rate-limited to 10 req/sec):

- **`card_cache` table**: Local copy of all card data in Supabase
- **Daily bulk sync via GitHub Actions**: A scheduled GitHub Actions workflow downloads Scryfall's **Default Cards** bulk data file (~90k cards, one entry per printing with accurate per-printing prices) and upserts into `card_cache`. GitHub Actions free tier provides 2,000 minutes/month; a daily sync takes ~2-3 minutes (~90 min/month). This avoids Vercel's serverless timeout limits (10s on Hobby tier) and keeps the sync off the critical path. Normal page loads never hit Scryfall.
- **Live API for search**: Card search/autocomplete during deck creation uses Scryfall's `/cards/autocomplete` and `/cards/search` endpoints (fast, lightweight)
- **Batch import**: Deck imports use `/cards/collection` endpoint (up to 75 cards per request — a 100-card Commander deck = 2 API calls)
- **Image CDN**: Card images served from `*.scryfall.io` (no rate limits on Scryfall's CDN)
- **Multi-face cards**: Scryfall returns transform/MDFC/split cards with a `card_faces[]` array and no top-level `image_uris`. The bulk sync stores the front face image in `image_uri_normal`/`image_uri_small` and the back face in `image_uri_back_normal`/`image_uri_back_small` (nullable columns). Components that display cards check for back face images and render a flip button when present.

### Image storage

Deck photos stored in Supabase Storage with public URLs. Commander art fetched from Scryfall's image API.

### Realtime

Use Supabase Realtime subscriptions for trade notifications (new proposals, status changes). No need for a separate WebSocket setup.

### In-person trades first, shipping later

MVP focuses on in-person trades at local game stores. This eliminates:

- Shipping fraud/damage/cost
- Counterfeit risk (inspect cards on the spot)
- Condition disputes (verify in person)
- Complex dispute resolution flows

Shipping support (with tracking numbers, delivery confirmation, etc.) will be added in a later phase to enable cross-city and cross-country trades.

### No payments in MVP

Cash differences are recorded in the trade but settled in person. This avoids money transmission regulations, sales tax collection requirements, and Stripe integration complexity. Stripe Connect will be added in Phase 2 once the marketplace has traction and legal counsel is engaged.

### Deck photos (encouraged, not required for MVP)

Since trades happen in person (cards inspected on the spot), photos are encouraged but not mandatory:

- Upload photos to make listings more attractive
- Request photos of specific cards during trade negotiation (before agreeing to meet)
- Mandatory photo requirements will be added when shipping trades are introduced

### Email notifications (Resend)

Email is essential — users won't check the site constantly. Transactional emails sent via Resend (triggered by Supabase Edge Functions or database webhooks):

- "Someone proposed a trade for your deck"
- "Your trade proposal was accepted/declined/countered"
- "Photo request: [user] wants to see [card name]"
- "A new deck matching your want-list was listed near you"
- "Please confirm your trade is complete"
- "You have a new review"
- Weekly digest: "X new decks listed near you" (optional, unsubscribable)

Users can manage notification preferences in settings.

### Mobile-first responsive design

Many MTG players browse on phones, especially at LGS events. Mobile is a **design priority**, not an afterthought:

- All pages must be fully functional on mobile
- Tailwind + shadcn/ui support responsive design natively
- Card grid layouts collapse to single-column on mobile
- Deck import and photo upload flows must work well on mobile (camera access for photos)

### Dispute resolution

Even with in-person trades, disputes can occur (one party confirms but the other doesn't, no-shows, misrepresentation). MVP approach:

- Either party can **cancel** a trade at any stage before both confirm completion
- Either party can **report a problem** after a trade (opens a dispute)
- **Flag a user** for suspicious behavior
- Admin reviews disputes manually (fine for MVP scale)
- Disputes affect reputation score
- Repeated disputes or flags can result in account suspension

### User reviews

After both parties confirm a trade is complete:

- Both users are prompted to leave a review (1-5 stars + optional comment)
- Reviews are public on the user's profile
- Average rating and total completed trades form the reputation score
- Cannot review until trade is confirmed complete by both parties

### Privacy & Legal

**PIPEDA compliance** — Canada's privacy law requires:

- **Privacy policy page** — what data we collect, how it's used, who it's shared with
- **Explicit consent** before sharing contact info with trade partners (consent checkbox in trade acceptance flow)
- **Data deletion** — users can request account and data deletion via settings
- **Minimal data collection** — only collect what's needed for the platform to function
- **Breach notification** — PIPEDA requires notification to the Privacy Commissioner and affected users within 72 hours of a data breach. Maintain a simple incident response checklist (even a markdown file) so this isn't improvised under pressure.

**Terms of Service** — required before launch. Must cover:

- Liability limitations for bad trades (platform facilitates, does not guarantee)
- Account suspension rights for abuse/fraud
- User content ownership (decks, photos, reviews)
- Dispute resolution process
- A simple ToS page at `/(public)/terms/` alongside the privacy policy

### Onboarding flow

Getting users to list their first deck is the most important conversion:

1. Sign up (email or Google)
2. Choose username
3. Set city + province
4. **"Import your first deck"** — prominent CTA with Moxfield URL as the happy path (paste URL → deck imported in seconds)
5. Option to skip and browse first
6. After first deck import, prompt to mark as "available for trade" or keep as collection-only

---

## Conventions & Patterns

### Service Error Handling

All service functions return `{ data, error }`. The error type is consistent across all services:

```typescript
type ServiceError = {
  code:
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'VALIDATION'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'INTERNAL'
  message: string // Human-readable, safe to display in UI
}

type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: ServiceError }
```

Define this in `src/types/service.ts`. Every service function returns `Promise<ServiceResult<T>>`. Components handle errors by checking `error.code` — never by parsing error message strings.

### React Server Components vs. Client Components

Default to **Server Components** (RSC) unless interactivity is required. Guidelines:

| Use RSC (default)                      | Use Client Component (`'use client'`)  |
| -------------------------------------- | -------------------------------------- |
| Pages that fetch and display data      | Forms with client-side validation      |
| Static layouts, headers, footers       | Components with `useState`/`useEffect` |
| Deck detail, profile, browse pages     | Card autocomplete (search-as-you-type) |
| Server-side data fetching via services | Realtime subscriptions (trade status)  |
|                                        | Photo upload with preview              |
|                                        | Interactive filters (browse page)      |

Pattern: RSC pages fetch data via services and pass it as props to client components that need interactivity. This keeps the data-fetching boundary clean.

### Input Sanitization

All user-generated text (deck names, bios, trade messages, review comments) is plain text — no HTML allowed. Next.js JSX escapes by default, which handles the display side. On the write side:

- Trim whitespace
- Enforce max lengths at the service layer (not just the form)
- Strip any HTML tags before storing (use a simple regex strip, not a sanitizer library — we don't want HTML at all)
- Supabase parameterized queries prevent SQL injection

### Username Policy

- 3-30 characters, alphanumeric + hyphens + underscores only
- Case-insensitive uniqueness (store lowercase, display original case)
- Reserved list: `admin`, `mod`, `moderator`, `decktrader`, `support`, `help`, `api`, `www`, `null`, `undefined`, `system`
- No username changes for MVP (pick carefully during onboarding). Change support is a Phase 2 feature.
- Validate on the client and enforce in the service layer + DB constraint

### Image Upload Validation

Enforce at the service layer before writing to Supabase Storage:

- **Allowed types**: JPEG, PNG, WebP only (check MIME type and magic bytes, not just file extension)
- **Max file size**: 5 MB per photo
- **Max photos per deck**: 10
- **Strip EXIF data** before storing (privacy — prevents leaking GPS coordinates). Use a lightweight library like `exif-stripper` or process via sharp.
- **Generate thumbnails** if needed via sharp (defer to Phase 2 — Scryfall CDN handles card images, deck photos are the only user uploads)

---

## Security

### Rate Limiting

Apply rate limiting from M0 to protect public-facing endpoints:

| Endpoint              | Limit               | Method                 |
| --------------------- | ------------------- | ---------------------- |
| Auth (login/register) | 5 req/min per IP    | Supabase Auth built-in |
| Trade proposals       | 10 req/min per user | Service layer check    |
| Deck creation         | 20 req/min per user | Service layer check    |
| Card search API       | 30 req/min per IP   | Service layer check    |
| Public browse pages   | No limit (cached)   | —                      |

MVP approach: simple in-memory rate limiting via a lightweight middleware or service-layer check using Supabase (store timestamps in a `rate_limits` table or use pg advisory locks). No need for Redis at this scale. Upgrade to Vercel's edge rate limiting or Upstash Redis if abuse occurs.

### CSRF Protection

Supabase Auth uses cookies for session management. CSRF mitigation:

- Next.js Server Actions include CSRF tokens automatically
- API routes that perform mutations must validate the `Origin` header matches the app domain
- Supabase's `@supabase/ssr` package handles cookie-based auth with built-in CSRF protection when used correctly via `createServerClient`

### Deck Lifecycle & Soft Deletes

Decks are never hard-deleted. The `status` enum handles lifecycle:

- `active` — visible on dashboard, can be marked for trade
- `in_trade` — locked into an active trade proposal
- `traded` — trade completed, kept for history
- `unlisted` — hidden from public browse but visible on owner's dashboard
- `archived` — soft-deleted by user, hidden everywhere but retained in DB

When a user "deletes" a deck, it moves to `archived`. Trades referencing archived decks still display correctly in trade history. Add `archived` to the `decks.status` enum in the migration.

### Trade State Machine

Explicit valid transitions — reject any transition not in this list:

```
proposed → accepted
proposed → declined
proposed → countered
proposed → cancelled        (by either party)

countered → accepted
countered → declined
countered → countered       (counter the counter)
countered → cancelled       (by either party)

accepted → meetup_scheduled (optional — either party sets date)
accepted → completed        (both parties confirm)
accepted → cancelled        (by either party, before completion)
accepted → disputed

meetup_scheduled → completed
meetup_scheduled → cancelled
meetup_scheduled → disputed

completed → (terminal)
cancelled → (terminal)
declined → (terminal)

disputed → completed        (admin resolves)
disputed → cancelled        (admin resolves)
```

Implement as a `VALID_TRANSITIONS` map in `src/lib/services/trades.ts`. The service rejects any status change not in the map.

### Degraded Experience

When external services are unavailable:

- **Scryfall API down**: Card autocomplete and live search fail. Show a clear error message ("Card search temporarily unavailable — try again in a few minutes"). Deck browsing, detail pages, and dashboard still work because they read from `card_cache`. Deck import (which hits Scryfall `/cards/collection`) shows a retry prompt.
- **Scryfall bulk sync fails**: `card_cache` retains last successful sync. Prices may be stale but the app functions normally. The GitHub Actions workflow should alert on failure (GitHub sends email on workflow failure by default).
- **Supabase down**: App is fully unavailable. No mitigation at MVP scale — Supabase's uptime SLA is sufficient.

---

## Operations

### Monitoring & Observability

**MVP**: Vercel built-in logging and analytics. GitHub Actions workflow failure emails for the bulk sync.

**Post-MVP**: Migrate to Grafana Cloud for centralized logging, dashboards, and alerting. Instrument with OpenTelemetry when the migration happens.

Key things to monitor from day one (via Vercel dashboard):

- Serverless function error rates and durations
- Build failures
- Edge middleware latency

### Backups

Supabase Free tier does not include automated backups. Until upgrading to Pro:

- Run `pg_dump` manually before and after migrations (via Supabase CLI: `supabase db dump`)
- The GitHub Actions bulk sync workflow should not delete data — only upsert
- User data is the priority; `card_cache` is fully rebuildable from Scryfall

### Staging Migration Flow

Supabase does not auto-run migrations on PR deploy. The flow:

1. Write migration locally, test with `supabase db reset` (local Docker)
2. Push PR — Vercel creates a preview deployment
3. Manually apply migration to staging Supabase: `supabase db push --linked` (with staging project linked)
4. Test the preview deployment against staging DB
5. Merge to `main` — Vercel deploys to production
6. Apply migration to production: `supabase db push --linked` (with production project linked)

Automate step 3 via GitHub Actions in a later milestone if the manual flow becomes painful.

### Dependency Updates (Dependabot)

Dependabot keeps dependencies current and patches security vulnerabilities automatically. Configure in M0 via `.github/dependabot.yml`:

- **npm (pnpm)**: Weekly PRs for `package.json` dependency updates
- **GitHub Actions**: Weekly PRs for action version updates in `.github/workflows/`
- Group minor/patch updates into a single PR to reduce noise
- Security updates are always opened immediately regardless of schedule
- CI (lint + type-check + build) runs on Dependabot PRs automatically — if it passes, safe to merge

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
    groups:
      minor-and-patch:
        update-types: ['minor', 'patch']
    open-pull-requests-limit: 5

  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
    open-pull-requests-limit: 3
```

---

## Future: Kubernetes & Microservices Migration Path

The architecture is designed for a smooth migration path:

**Next.js → K8s**: Use `output: 'standalone'` in next.config.js → Dockerfile → K8s deployment. Trivial.

**Supabase → K8s**: Two options:

1. Self-host Supabase on K8s via official Helm charts (Postgres, GoTrue auth, Storage API, Realtime as K8s services)
2. Replace with individual services (self-managed Postgres + custom auth + S3 storage)

**Microservices extraction**: The service layer maps to natural domain boundaries:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  User/Auth   │  │   Decks +   │  │   Trades +  │
│   Service    │  │   Cards     │  │   Meetups   │
└─────────────┘  └─────────────┘  └─────────────┘
       ┌─────────────┐  ┌─────────────┐
       │   Payments   │  │ Notifications│
       └─────────────┘  └─────────────┘
```

To extract a microservice: take the corresponding `src/lib/services/*.ts` file, turn it into its own API, and update the service file to call that API instead of Supabase. No component code changes needed.

---

## What's NOT in MVP

- **Shipping trades** (MVP is in-person only; shipping added later for cross-city/cross-country)
- **USA expansion** (Canada first; USA in Phase 2)
- Payment processing (Stripe Connect deferred to Phase 2)
- Transaction fees (launch fee-free to build liquidity)
- In-app chat/messaging (off-platform coordination after contact info exchange)
- Trade suggestion engine
- Advanced deck value estimation (MVP uses sum of Scryfall card prices)
- Mobile app
- Advanced reputation algorithm (MVP uses completed-trade count + average rating)
- Insurance
- Advanced deck analytics (price history over time, meta analysis)
- Partial-deck trades / cherry-picked singles within a deck trade (Phase 2 — helps solve "I don't want all your cards" problem)
- Discord OAuth (Google + email for MVP)
