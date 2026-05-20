# Habit Game

A personal habit / task / focus tracker that runs as a Telegram Mini App.

Stack: **React 19 + Vite + Tailwind v4 + Supabase + @twa-dev/sdk**, deployed on **Vercel**.

## Features

- **Today** — progress ring, daily score, top priorities, time blocks, habits due today, quick check-in chips (water/meal/expense/sleep)
- **Inbox** — capture tasks/ideas, promote into tasks
- **Habits** — daily / weekdays / weekends frequency, streak counters, suggestions
- **Progress** — 7D/14D/30D/Month range, score gauge, stat cards, collapsible category sections
- **More** — Projects, Areas, Rituals, Health (water/meals), Money (expenses), Daily Plans, Reviews, Activity

## Architecture

```
Telegram client (Mini App)
    │  initData (HMAC-signed by Telegram)
    ▼
Vercel-hosted React SPA (this repo)
    │  POST /functions/v1/telegram-auth { initData }
    ▼
Supabase Edge Function (telegram-auth)
    │  Verifies HMAC, upserts profiles row, mints Supabase-compatible JWT
    ▼
Client uses JWT in Authorization header for direct Supabase calls
    │
    ▼
PostgreSQL (14 tables, RLS scoped by JWT.sub = profiles.id)
```

## Env vars

### Client (Vercel)

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://bmincaoicwpdqifkyazb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` |

### Edge function (Supabase Dashboard → Settings → Functions → Secrets)

| Name | Where to find |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather, when you create the bot |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard → Settings → API → JWT Secret |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase.

## Local dev

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. You'll see an error screen because `initData` is only present inside Telegram. For real testing, deploy to Vercel and open via the bot.

## Deploying

1. Push to GitHub.
2. In Vercel: New Project → Import → Vite preset → add the env vars above → Deploy.
3. In BotFather: `/myapps` → pick your app → Edit Web App URL → paste the Vercel HTTPS URL.
4. Open the bot in Telegram, tap the Mini App button.

## Schema

Migrations live in Supabase project `bmincaoicwpdqifkyazb`:

- `01_profiles_and_helpers` — `profiles` + updated_at trigger
- `02_core_tables` — `areas`, `projects`, `habits`, `habit_logs`, `tasks`, `inbox_items`, `time_blocks`, `water_logs`, `meals`, `expenses`, `reviews`, `rituals`, `user_settings`
- `03_rls_policies` — RLS on every table, `app_user_id()` helper reading JWT `sub` claim
- `04_views_and_rpc` — `daily_summary` view, `habit_streak()` and `daily_score()` functions
