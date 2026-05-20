# Habit Game — Progress & State

_Last updated: 2026-05-20_

A personal Telegram Mini App for habits, tasks, focus blocks, daily check-ins, money & health logging, and progress review. Built as the user-facing app `@momentumcore_bot` / short name `momentum`.

---

## 1 · Live URLs & identities

| Thing | Where |
|---|---|
| Bot | `@momentumcore_bot` (Telegram ID `8692951975`, display name "Momentum") |
| Mini App link | https://t.me/momentumcore_bot/momentum |
| Production frontend | https://habit-game-one.vercel.app |
| GitHub repo (public) | https://github.com/simittester/habit-game |
| Supabase project | `habit-game` (ref `bmincaoicwpdqifkyazb`, region `eu-west-1`) |
| Supabase URL | https://bmincaoicwpdqifkyazb.supabase.co |
| Edge function | `telegram-auth` (`/functions/v1/telegram-auth`) |

Supabase organisation: `CaspianWeb` (`cocqbcglsbhxriesdiwa`).

---

## 2 · Stack

- **Frontend**: React 19, Vite 8, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`)
- **Routing**: react-router-dom v7
- **Data**: `@tanstack/react-query` v5
- **Backend**: Supabase Postgres + Edge Function (Deno)
- **Auth**: Custom — Telegram `initData` → HMAC verify in edge function → Supabase-compatible JWT (HS256, signed with project JWT secret)
- **Telegram SDK**: read `window.Telegram.WebApp` directly (script loaded in `index.html`). The `@twa-dev/sdk` import was dropped because of module-load timing issues.
- **Hosting**: Vercel (free Hobby tier), auto-deploy on push to `main`
- **Icons**: `lucide-react`
- **Date utils**: `date-fns`

---

## 3 · Architecture

```
Telegram client (Mini App)
    │  initData (HMAC-signed by Telegram with bot token)
    ▼
Vercel-hosted React SPA (habit-game-one.vercel.app)
    │  POST /functions/v1/telegram-auth { initData }
    ▼
Supabase Edge Function (telegram-auth)
    │  1. Verifies HMAC(initData, "WebAppData", bot_token)
    │  2. Upserts profiles row (telegram_id is unique)
    │  3. Mints Supabase-compatible JWT: sub = profile.id, role = "authenticated"
    ▼
Client stores JWT, uses it as Authorization: Bearer for direct Supabase calls
    │
    ▼
PostgreSQL (15 tables) — RLS on every table, scoped by JWT.sub = profiles.id
```

### Auth detail

- The edge function signs HS256 JWTs with the project's **JWT Secret** (in Supabase as `JWT_SECRET`).
- Postgres helper function `app_user_id()` reads `sub` from `request.jwt.claims` and returns it as `uuid`.
- Every owner RLS policy is `using (user_id = app_user_id()) with check (user_id = app_user_id())`.
- JWT TTL: 7 days. Token cached in `localStorage`; refresh runs in background each launch.

### Validation gotcha that bit us

Telegram WebApp **9.x** signs the initData over **all fields except `hash`** — including the new `signature` field. Excluding `signature` from the data-check-string (which earlier-era docs suggest) breaks verification on WebApp 9.6. The current edge function deletes **only `hash`** and keeps everything else.

---

## 4 · Database schema

15 tables, all RLS-protected:

| Table | What it holds |
|---|---|
| `profiles` | One row per Telegram user (the user identity, also serves as RLS subject) |
| `areas` | Life domains (Health, Work, Personal) |
| `projects` | Concrete outcomes inside areas |
| `habits` | Habit definitions (Daily / Weekdays / Weekends / Custom) |
| `habit_logs` | One row per habit per day, with optional count + note |
| `tasks` | Open / done / cancelled, with priority 0–2 |
| `inbox_items` | Quick-capture notes, can be promoted to tasks |
| `time_blocks` | Scheduled blocks on a given date |
| `water_logs` | Per-day water tracking |
| `meals` | Per-meal log with optional calories |
| `expenses` | Per-expense log with category + amount |
| `reviews` | Daily / weekly / monthly journal entries |
| `rituals` | Morning / evening / weekly-review templates |
| `user_settings` | Preferences (water target, currency, start of week…) |

Plus:

- View `daily_summary` (60-day window of per-day aggregates: tasks done / planned, habit completion, water, meals, expenses, blocks)
- Function `daily_score(date)` → 0–100 composite score from habits, tasks, water, blocks
- Function `habit_streak(habit_id)` → current consecutive-day streak

Migrations applied:

1. `01_profiles_and_helpers` — extensions, profiles, updated_at trigger
2. `02_core_tables` — all other tables
3. `03_rls_policies` — RLS + `app_user_id()` helper
4. `04_views_and_rpc` — `daily_summary`, `habit_streak`, `daily_score`

---

## 5 · App surfaces (screens)

| Tab | Screen | Status |
|---|---|---|
| Today | Greeting, progress ring, daily check-ins (water/meal/expense/sleep), top priorities, time blocks, habits today | UI built, reads work |
| Inbox | Quick capture, list of unprocessed items, "promote to task" arrow | UI built |
| Habits | List with streak chips, Add modal (Daily/Weekdays/Weekends + emoji picker + suggestions) | UI built |
| Progress | 7D/14D/30D/Month range tabs, score gauge, stat cards, 9 collapsible category sections | UI built |
| More | Links to all secondary screens, plus account info card | UI built |
| More → Projects | List + add | UI built |
| More → Areas | Grid + add | UI built |
| More → Rituals | List + add + templates (morning kickstart / evening shutdown / weekly review) | UI built |
| More → Health | Water +/- counter, meals log with type chips | UI built |
| More → Money | Total card, history list, add modal with category grid | UI built |
| More → Daily Plans | Date stepper, time-block list for any date | UI built |
| More → Reviews | Today's review editor (highlights/lowlights/lessons/focus) + past reviews | UI built |
| More → Captures | Alias for Inbox | UI built |
| More → Activity | Last 30 days timeline of daily summaries | UI built |

Shared:
- Floating **+** button on every tab opens a quick capture sheet (Inbox / Top Priority modes)
- Haptic feedback on every interaction
- Telegram back-button wired to react-router on detail screens

---

## 6 · Setup journey (what we hit and fixed)

| # | Hurdle | Resolution |
|---|---|---|
| 1 | Need a Telegram bot | User created `@momentumcore_bot` via BotFather, also created mini app `momentum` |
| 2 | Telegram `initData` had to be verified server-side | Wrote Deno edge function `telegram-auth` with Web Crypto HMAC-SHA256 |
| 3 | Need a way to give the client a session | Edge function mints a Supabase-compatible JWT (HS256) using the project's JWT secret |
| 4 | RLS needed to scope rows to the right user | `app_user_id()` helper reads `sub` from JWT claims; all tables use `user_id = app_user_id()` |
| 5 | Supabase rejected `SUPABASE_JWT_SECRET` as a secret name | Renamed to `JWT_SECRET` (Supabase reserves the `SUPABASE_` prefix) |
| 6 | Vercel blocked git pushes from `kamal@habit-game.local` (not a team member) | Made the repo public — Vercel skips author verification on public repos |
| 7 | `initData` looked empty in real Telegram launches initially | Switched from `@twa-dev/sdk` to reading `window.Telegram.WebApp` live + 1.2 s retry loop |
| 8 | HMAC `hash_mismatch` even with correct fields | Bot token in Supabase was wrong / truncated; re-pasted full 46-char token |
| 9 | Still `hash_mismatch` after token fix | Realised Telegram WebApp 9.6 signs over `signature` too — must exclude only `hash` from the data-check-string. Reverted the `signature` exclusion |
| 10 | Sign-in flow finally green | Edge function v9 + frontend cache + JWT-based RLS all working end-to-end |

---

## 7 · Known issues / TODO

### 🔴 Critical bug — Save buttons silently fail across the app

**Symptom:** On every "Add" sheet (habit, task, project, area, expense, meal, block, ritual, review) the Save / Add button doesn't persist anything.

**Likely cause:** Insert API calls in `src/api/*.ts` don't include `user_id`, but the `user_id` column is `not null` with no default. Postgres rejects the insert (probably with a constraint violation) before RLS even runs, and the client error path isn't surfacing the message.

**Fix plan (not yet applied):**

1. Migration `05_user_id_defaults`:
   ```sql
   alter table habits        alter column user_id set default app_user_id();
   alter table tasks         alter column user_id set default app_user_id();
   alter table areas         alter column user_id set default app_user_id();
   alter table projects      alter column user_id set default app_user_id();
   alter table habit_logs    alter column user_id set default app_user_id();
   alter table inbox_items   alter column user_id set default app_user_id();
   alter table time_blocks   alter column user_id set default app_user_id();
   alter table water_logs    alter column user_id set default app_user_id();
   alter table meals         alter column user_id set default app_user_id();
   alter table expenses      alter column user_id set default app_user_id();
   alter table reviews       alter column user_id set default app_user_id();
   alter table rituals       alter column user_id set default app_user_id();
   alter table user_settings alter column user_id set default app_user_id();
   ```
2. Also: bubble Supabase error messages up to a toast / haptic so future failures are visible instead of silent.

### 🟡 Other bugs to look for (not yet confirmed)

- After Save, query cache may not invalidate properly — verify each mutation has the right `onSuccess` invalidation set.
- Time-block add: `start_time` is sent as `HH:MM:00` — confirm Postgres `time` column accepts it.
- Toggle habit done: `toggleHabitToday` does its own profile-id lookup from localStorage — should switch to default-`user_id` flow once migration 05 is applied.

### 🟢 Polish list (not blocking)

- Bundle size 614 KB → split routes for first-paint
- BotFather menu button (`/setmenubutton`) for one-tap launch from the bot chat
- Push commit author email = real GitHub email so the repo can be flipped back to private if desired
- Migration for asymmetric JWT signing if Supabase forces it on free projects later
- Settings screen wired up (currently the ⋯ menu button just shows an alert)
- Multi-user productisation (Stripe gate, Russian/English copy switch — language_code already captured in profile)

---

## 8 · How to keep working on this

```bash
# Local dev
cd habit-game
npm install
npm run dev   # http://localhost:5173

# Deploy (auto on push to main)
git add -A && git commit -m "..." && git push

# Edge function redeploy
# Use Supabase MCP: deploy_edge_function (project_id bmincaoicwpdqifkyazb, name telegram-auth)
# or `supabase functions deploy telegram-auth --project-ref bmincaoicwpdqifkyazb`

# DB migration
# Use Supabase MCP: apply_migration (project_id bmincaoicwpdqifkyazb)
# Always include a name in snake_case
```

Secrets currently set in Supabase **Edge Function Secrets**:

- `TELEGRAM_BOT_TOKEN` (46 chars, format `<bot_id>:<token>`)
- `JWT_SECRET` (project JWT secret from Settings → API)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected.

Vercel **environment variables** (Production + Preview):

- `VITE_SUPABASE_URL = https://bmincaoicwpdqifkyazb.supabase.co`
- `VITE_SUPABASE_ANON_KEY = sb_publishable_oobhPsyCbR2Kio3E6LRv0Q_cpjVa0we`

---

## 9 · Important behavioural notes

- **Bot token rotation**: if ever leaked, send `/revoke` to BotFather → update `TELEGRAM_BOT_TOKEN` in Supabase secrets. Frontend doesn't need to change.
- **JWT secret rotation**: if rotated, also re-issue tokens (client cache invalidated automatically when verification fails, falls back to fresh sign-in).
- **Telegram WebApp version drift**: each new Telegram WebApp version can add fields to `initData`. As long as we exclude only `hash` from the data-check-string, new fields are auto-included and HMAC keeps working. Watch the release notes anyway.
- **Repo visibility**: currently **public** for Vercel deploy reasons. No secrets are in the repo. If made private later, push commits with an author email that matches your GitHub account (the current placeholder `kamal@habit-game.local` will break Vercel auto-deploy).
