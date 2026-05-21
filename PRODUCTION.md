# Production checklist

What's done, what's deferred, and what you (the human) still need to do before launch.

## ✅ Done — already shipped

| Item | How |
|---|---|
| **Privacy Policy** | Static page at `https://habit-game-one.vercel.app/legal/privacy.html` |
| **Terms of Service** | Static page at `https://habit-game-one.vercel.app/legal/terms.html` |
| **In-app links** | Both linked from Settings → Legal |
| **HMAC verification** | Edge function verifies Telegram-signed initData on every sign-in |
| **Replay protection** | Reject `initData` with `auth_date` older than 1 hour |
| **Per-user rate limit** | Edge function: 30 requests/min per Telegram user ID |
| **Row-Level Security** | Every Postgres table scoped by JWT `sub` → `profiles.id` |
| **HTTPS everywhere** | Telegram requires it; Vercel + Supabase serve it |
| **Input validation** | Weight 20–300 kg, height 50–250 cm at client + DB |
| **Secrets out of repo** | Bot token + JWT secret live in Supabase secrets only |

## ☐ Things only you can do

### 1. Set Privacy Policy URL in BotFather
- Open `@BotFather` → `/mybots` → `@momentumcore_bot` → **Bot Settings** → look for **Privacy Policy** (newer BotFather) or use `/setprivacy` text command
- Paste: `https://habit-game-one.vercel.app/legal/privacy.html`
- (If your BotFather version doesn't have this field, leave it — the link is in the app via Settings.)

### 2. Test with a second Telegram account
- Have a friend (or your alt account) open `https://t.me/momentumcore_bot/momentum`
- Verify they get their own data — not yours
- Verify the heatmap, streaks, and progress show *their* numbers
- Verify they can't see your habits/tasks via any inspector tooling
- **If something's wrong here, do not launch.** RLS is the entire security model.

### 3. Telegram Payments / Stars compliance (when monetising)
- Decide: **Telegram Stars** (in-Telegram payments, 30% Telegram fee, payouts in USDT) or **Stripe** (external link out of TG, lower fees, more friction).
- For Stars: BotFather → Bot Settings → **Payments** → enable. Accept the Bot Payments Terms.
- Set tax info if charging > $0.
- Update Terms of Service section 4 (subscription) with your actual prices and cancellation policy before going live.
- Be aware of Telegram's "no off-platform payments" rule for Telegram-Stars-enabled bots.

### 4. Backup strategy — Supabase Free tier
- Free tier includes **daily automatic backups, retained for 7 days**, via the Supabase dashboard.
- View: Dashboard → `habit-game` project → **Database** → **Backups**.
- To restore: contact Supabase support; self-service restore is paid only.
- **When you should upgrade**: when you have paying users. Pro tier = $25/mo and gives you point-in-time recovery for 7 days + 4-hour-granularity for 30 days.

### 5. Domain (optional, polish)
- Right now you're on `habit-game-one.vercel.app`. Cheap to attach a custom domain like `momentum.app` or `getmomentum.app`.
- Vercel dashboard → project → **Domains** → add. Update BotFather Web App URL afterward.
- Recommended: do this before any TikTok push. The URL in screenshots matters.

## ☐ Deferred for after launch

### 6. Error tracking (Sentry)
- Skipped for now. When you start seeing real traffic, sign up at sentry.io (free tier: 5k errors/mo) and:
  1. `npm install @sentry/react`
  2. Init in `src/main.tsx`
  3. Wrap `<App />` in `<Sentry.ErrorBoundary>`
  4. Add `VITE_SENTRY_DSN` to Vercel env vars
- 30 min total work when you need it.

### 7. Stricter rate limits
- Current limit is **in-memory per Edge Function instance**. It resets on cold start, so it's a soft limit, not a hard one. Fine for low traffic.
- When you have meaningful traffic, swap to a Supabase table `rate_limits(user_id, window_start, request_count)` for global per-user limits. Or front the function with Cloudflare.

### 8. Bot avatar legal check
- Your logo (the purple M-mountain) is your own design — copyright OK.
- If you ever swap to an emoji/stock graphic, double-check the source license.

## Compliance summary by region (informational, not legal advice)

- **GDPR (EU)** — covered: data minimisation, access right, deletion right, controller named in policy.
- **CCPA (California)** — covered for the same reasons; not applicable since you're not selling data.
- **App store rules** — N/A, you're not on iOS App Store or Play Store; Telegram's own Mini App rules apply.
- **Underage users** — Privacy Policy excludes <13. If you market on TikTok where many users are teens, consider raising to 16 (some jurisdictions).

## When something goes wrong

| Symptom | Most likely cause | Fix |
|---|---|---|
| Users can't sign in | Edge function down or bot token rotated | Check Supabase edge function logs |
| Users see "stale_initData" | Their Telegram WebApp cached an old auth | They reopen via `t.me/...` — fresh initData |
| User sees someone else's data | RLS broken | **Stop everything.** Check policies, especially `app_user_id()` |
| App stops loading | Vercel deploy failed | Vercel dashboard → Deployments → Roll back |
| Data lost | DB corruption / mistake | Supabase Dashboard → Backups → restore from last night |
