# Momentum — Continuation Brief

**Drop the entire contents of this file into your next Claude Code chat as the first message.**

---

## TL;DR

I'm continuing work on **Momentum** — a Telegram Mini App for habit / task / focus / health / money tracking, sold as a $9.99/mo or $59.99/yr subscription. It's live at https://habit-game-one.vercel.app and reached via bot `@momentumcore_bot` (mini app slug `momentum`). Repo: https://github.com/simittester/habit-game (public).

The codebase is React 19 + Vite + Tailwind v4 on the frontend, Supabase (Postgres + Edge Functions) on the backend, Gumroad as the payment merchant of record. We've already built almost everything — full feature set, 3-day trial, paywall, payments wired, read-only gating, branding (purple `#8b5cf6` + custom M logo), legal pages, edge function hardening, sleep tracking, 9 rich Progress panels with charts. **The app is ready to launch.**

---

## What's done (don't rebuild any of this)

- 🟢 Auth via Telegram initData → HMAC verify in edge function → Supabase JWT
- 🟢 RLS on every table scoped by `app_user_id()` (reads JWT.sub)
- 🟢 Full feature set across 5 tabs: Today, Inbox, Habits, Progress, More
- 🟢 Habits: list, add (multi-select in onboarding), edit, archive, delete, streaks, detail screen with 14-week heatmap, milestone confetti
- 🟢 Tasks: list, add, edit, project picker, priorities, scheduling
- 🟢 Projects: list with progress bar, detail screen with linked tasks, area linking
- 🟢 Areas, Rituals (Evening shutdown + Weekly review + History), Daily Plans (time blocks per day)
- 🟢 Health: water, meals, weight + BMI + sparkline, **sleep logging** (hours/bedtime/wake/quality/note)
- 🟢 Money: expenses, categories, cash flow chart
- 🟢 Inbox: capture, promote-to-task with feedback, delete
- 🟢 Today: progress ring, check-in chips, top priorities, time blocks, habits today
- 🟢 Progress: 7D/14D/Month tabs, calendar view, score gauge, **9 rich collapsible panels** with charts (Tasks/Habits/Health/Money/Daily Plans/Projects&Areas/Captures/Reviews/Activity)
- 🟢 Settings: water target, sleep target, currency, week start, daily priorities, sign out, legal links
- 🟢 Onboarding flow (welcome → habits multi-pick → goal → first task → done), gated on `onboarded_at`
- 🟢 Animations: count-up numbers, scale-pop checkboxes, ring pulse at 100%, milestone confetti, flame chip tiers, slide-out delete
- 🟢 Branding: purple `#8b5cf6` accent, custom M-mountain logo (user designed), splash screen `#0a0a0c`
- 🟢 Legal: Privacy + Terms static pages at `/legal/privacy.html` + `/legal/terms.html`, linked in Settings
- 🟢 Edge function hardening: `auth_date` freshness check (1 hour) + per-user rate limit (30/min)
- 🟢 Monetization: 3-day trial → paywall sheet → Gumroad checkout
- 🟢 Gumroad webhook (`/functions/v1/gumroad-webhook`) verifies sales via API, updates `user_settings.subscription_*`
- 🟢 Read-only gating via `useGate()` hook — every Add/Toggle/Delete opens paywall when trial expired
- 🟢 Paywall is dismissable (Done/X buttons work) — banner still nags
- 🟢 Decimal input fix (accepts both `.` and `,` for RU/EU keyboards)
- 🟢 `gumroad_events` table has RLS + Supabase function search_paths pinned

---

## Live URLs & secrets references

| Thing | Where |
|---|---|
| Bot | `@momentumcore_bot` (Telegram ID `8692951975`) |
| Mini App link | https://t.me/momentumcore_bot/momentum |
| Frontend | https://habit-game-one.vercel.app |
| Repo (public) | https://github.com/simittester/habit-game |
| Supabase project | `habit-game` (ref `bmincaoicwpdqifkyazb`, region `eu-west-1`) |
| Edge functions | `telegram-auth` (v9), `gumroad-webhook` (v1) |
| Gumroad product | `https://getmomentum.gumroad.com/l/momentum` |
| Vercel project | `habit-game` under `sashas-projects-d00b7681` |

Supabase secrets already configured:
- `TELEGRAM_BOT_TOKEN`
- `JWT_SECRET`
- `GUMROAD_ACCESS_TOKEN`
- `GUMROAD_PRODUCT_URL`
- `BOT_URL`

Vercel env vars:
- `VITE_SUPABASE_URL=https://bmincaoicwpdqifkyazb.supabase.co`
- `VITE_SUPABASE_ANON_KEY=sb_publishable_oobhPsyCbR2Kio3E6LRv0Q_cpjVa0we`

The dev's own account (telegram_id `958247905`) has been comp'd with `subscription_status = 'active'` until 2099.

---

## Code conventions you should follow

- **State**: React 19 + `@tanstack/react-query` v5. No Redux/Zustand.
- **Routing**: `react-router-dom` v7. Routes in `src/App.tsx`.
- **Styling**: Tailwind v4 via `@tailwindcss/vite`. Custom CSS vars in `src/index.css` (`--color-accent`, `--color-bg`, etc.).
- **Components**: function components with hooks. Reusable bits in `src/components/`. Screen components in `src/screens/`.
- **Mutations**: always invalidate relevant query keys in `onSuccess`. Global error handler in `src/lib/queryClient.ts` shows Telegram alerts.
- **Gating**: any new create/edit/delete button must call `gate(...)` from `useGate()` hook — otherwise trial-expired users can bypass.
- **Decimal inputs**: use `sanitizeDecimal()` from `src/lib/numbers.ts`.
- **Telegram tooling**: `tg` from `src/lib/telegram.ts` for haptics/alerts/initData. Never import `@twa-dev/sdk` directly (caching issues).
- **Charts**: SVG primitives in `src/components/charts/` — `MiniLineChart`, `MiniBarChart`, `CashFlowChart`, `ProgressRow`, `StatTrio`, `InsightCard`, `ActivityGrid`. Pure SVG, no chart library.
- **Telegram WebApp API**: read `window.Telegram.WebApp` live via `tg.webApp()` — never cache.
- **TypeScript**: strict mode, `verbatimModuleSyntax`, `noUnusedLocals`. Use `import type` for types.
- **Files**: I never create README.md or docs unless asked. Stick to source files.
- **Commits**: not interactive in editor; pass message via `-m`. Always commit + push to `main` (Vercel auto-deploys).

---

## Database schema (15 user-owned tables)

All tables have `user_id uuid not null default app_user_id()` and full RLS scoped to `app_user_id()`.

`profiles`, `areas`, `projects`, `habits`, `habit_logs`, `tasks`, `inbox_items`, `time_blocks`, `water_logs`, `meals`, `expenses`, `reviews`, `rituals`, `user_settings`, `weight_logs`, `sleep_logs`

Plus `gumroad_events` (audit log, no client access).

Helper SQL: `app_user_id()`, `set_updated_at()` (trigger), `habit_streak(uuid)`, `habit_streaks()`, `daily_score(date)`.

View: `daily_summary` (60-day rolling per-day aggregates).

Migrations applied: 01–13 (see `supabase/migrations/` if mirrored locally, or use Supabase MCP `list_migrations`).

---

## What's NOT done — your next-session backlog

### 🔴 Critical before any ad spend

1. **Test ONE real $9.99 Gumroad purchase end-to-end.** Buy your own product from a 2nd email/account. Verify the webhook flips that account's `subscription_status` to `active` and the app unlocks. This is the only meaningful untested thing.

### 🟡 Should ship before TikTok launch

2. **Evening Shutdown 3-card redesign.** User shared a reference (image not preserved here, but the pattern): three labeled cards with one short answer each — `WIN` / `CARRYOVER` / `TOMORROW PRIORITY`. Current evening shutdown uses 4 multi-step questions in a sheet. Map: WIN → highlights, CARRYOVER → (new field, or repurpose lowlights), TOMORROW PRIORITY → next_focus. Decide if you want to keep current 4-step flow OR switch to inline 3-card form. Files: `src/screens/RitualsScreen.tsx`, `src/components/RitualFlowSheet.tsx`.

3. **Custom domain.** Buy `getmomentum.app` or similar. Point at Vercel. Update BotFather web app URL. Makes ad screenshots look real.

### 🟢 Nice-to-have

4. **Push notifications** (habit reminders, evening shutdown nudge at 21:00). Needs: a webhook backend for the bot (currently zero bot-server logic), a cron worker, Telegram Bot API `sendMessage` calls. ~4-6 hours.
5. **Russian translation**. User's `language_code` is `ru`. Extract strings to a dictionary, switch by profile.language_code.
6. **AI features** for ad bait: Weekly review with Claude auto-summary, "You're 3× more likely to log this before 10am" insights.
7. **Admin panel** for managing comp'd users (give friends free access without SQL). Deferred.
8. **Bundle size split**. 614 KB → ~150 KB first paint with `React.lazy` route splitting.
9. **Swipe-down-to-dismiss** gesture on sheets (currently just visual handle). ~30 min.

### 🐛 Small bugs / polish

- After deleting an inbox/money item, scroll position can jump.
- Old custom rituals from pre-rebuild are orphaned in DB (no UI).
- `daily_summary` view only covers 60 days back — older history invisible (replace view with date-param function later).
- Real commit author email — currently fake `kamal@habit-game.local`. If repo is ever flipped back to private, Vercel deploys will break.

---

## Marketing direction (already discussed, don't re-plan)

User wants TikTok / Reddit / IndieHackers / Russian Telegram channels organic, then $1-week intro hook in ads. Pricing locked: $9.99/mo or $59.99/yr (50% saving). Trial: 3 days no-card. Refund: 7 days via Gumroad. Target audience: young, motivated, EU/US. Latvia-based dev.

---

## Files I'd skim first as the new chat opens

- `PROGRESS.md` (full state, schema, journey)
- `PRODUCTION.md` (launch checklist + troubleshooting)
- `src/App.tsx` (route map + provider wiring)
- `src/screens/TodayScreen.tsx`, `src/screens/ProgressScreen.tsx` (main UI surfaces)
- `src/components/PaywallSheet.tsx` (payment UX)
- `src/hooks/useSubscription.ts`, `src/hooks/useGate.ts` (gating logic)
- `supabase/functions/telegram-auth/index.ts`, `supabase/functions/gumroad-webhook/index.ts` (only if mirrored locally; otherwise read from Supabase MCP `get_edge_function`)

---

## Tone

User is decisive, ships fast, prefers tactical advice over abstract. Tell them when something will trap them, give 2-3 ranked options, then execute. They're cost-conscious about Claude tokens — batch your asks, single screenshots not 14-image dumps, use file paths instead of pasting code.

Skill: founder-grade, can read code, knows when not to gold-plate. Trust their direction.
