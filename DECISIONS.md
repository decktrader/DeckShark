# DeckTrader — Decision Log

Architectural and implementation decisions made during development. Newest first.

<!-- Format:
## YYYY-MM-DD — Short title
**Context:** Why the decision came up
**Decision:** What we chose
**Alternatives considered:** What else we looked at
**Rationale:** Why this option won
-->

## 2026-03-21 — Move repo to `decktrader` GitHub org

**Context:** Repo was under `nikosmeds/decktrader` — single-owner risk for a two-person team.
**Decision:** Created `decktrader` org, transferred repo to `decktrader/decktrader`.
**Alternatives considered:** Keep under personal account, use a different org name.
**Rationale:** Shared ownership, easier team permissions, better to do early before integrations accumulate. GitHub redirects old URLs automatically.
