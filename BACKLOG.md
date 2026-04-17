# DeckShark — Backlog

<!-- Newest entries at the top. Check items off as they're completed. -->

### 2026-04-17 — Future settings enhancements

- [ ] Appearance tab — dark/light/system theme toggle (requires building light theme)
- [ ] Default browse view preference (grid/list) stored in user profile
- [ ] Two-factor authentication (TOTP)
- [ ] Blocked users list and management
- [ ] Trade preferences (preferred formats, min trade value, trade radius)
- [ ] Push notification preferences (when PWA push is implemented)

### 2026-04-12 — M19 Admin Portal deferred phases

- [ ] Rate limit dashboard — show top rate-limited IPs/users, hit counts by endpoint (requires Upstash logging)
- [ ] Sentry integration in admin — embed error feed or lightweight error summary by route
- [ ] Storage usage — deck-photos bucket size and growth (Supabase Storage API)
- [ ] Deck photo moderation — thumbnail grid of recently uploaded photos for quick review
- [ ] Email preferences overview — opt-in/opt-out counts, useful before re-engagement campaigns
- [ ] Quick user lookup by email in admin users page (currently only username/city search)
- [ ] Outlier detection trigger — flag lopsided trades for admin review
- [ ] Review spam detection — flag reviews from accounts with no completed trades
- [ ] Audit log — track all admin actions (suspend, flag, edit) with admin_user_id, timestamp, details

### 2026-04-12 — Admin growth chart cleanup

- [x] Delete unused `src/components/admin/growth-metrics.tsx` (replaced by growth-charts.tsx) — already deleted
- [x] Remove unused `getGrowthData` function from admin.server.ts (replaced by getGrowthChartData)
