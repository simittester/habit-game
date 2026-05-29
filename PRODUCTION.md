# Production checklist

What's done, what's deferred, and what you (the human) still need to do before launch.

_Last updated: 2026-05-29_

---

## ✅ Done — already shipped

| Item | Where |
|---|---|
| **Privacy Policy** | Static page at `/legal/privacy.html` |
| **Terms of Service** | Static page at `/legal/terms.html` (covers EU cooling-off, refund, governing law) |
| **In-app legal links** | Settings → Legal section |
| **HMAC verification** | Edge function verifies Telegram-signed initData on every sign-in |
| **Replay protection** | Reject `initData` with `auth_date` older than 1 hour |
| **Per-user rate limit** | Edge function: 30 requests/min per Telegram user ID |
| **Row-Level Security** | Every Postgres table scoped by JWT `sub` → `profiles.id`. Verified manually with a 2nd Telegram account |
| **HTTPS everywhere** | Vercel + Supabase + Gumroad all enforce |
| **Input validation** | Weight 20–300 kg, height 50–250 cm (client + DB CHECK), sleep 1–16 hrs, target 4–12 hrs |
| **Decimal locale support** | Inputs accept both `.` and `,` (RU/EU keyboards) via `sanitizeDecimal()` |
| **Secrets out of repo** | Bot token + JWT secret + Gumroad token live in Supabase secrets only |
| **`gumroad_events` table locked down** | RLS enabled, anon/authenticated revoked. Service role bypasses RLS so the webhook still works |
| **Function search_paths pinned** | `set_updated_at`, `app_user_id`, `habit_streak`, `daily_score`, `habit_streaks` all `set search_path = public, pg_temp` |
| **Bot branding** | Custom M-mountain logo as avatar + splash icon. About + Description set. Splash bg `#0a0a0c`. |
| **Trial + paywall** | 3-day free trial, paywall sheet, Gumroad checkout wired with telegram_id passthrough |
| **Read-only gating** | `useGate()` hook intercepts every Add/Toggle/Delete when expired and opens paywall |
| **Payment webhook deployed** | `/functions/v1/gumroad-webhook` validates each sale via Gumroad API |
| **Gumroad Ping URL set** | Settings → Advanced → points at the webhook |

---

## 🔴 Critical — DO before any ad spend

### Real $9.99 test purchase end-to-end

Has the full money → unlock loop been verified with a real card? **No.** We've only:

- ✅ Deployed the webhook
- ✅ Verified `gumroad_events` is RLS-locked
- ✅ Verified the paywall opens the right URL

We have NOT verified:
- ❌ Gumroad actually fires the Ping on purchase
- ❌ Our webhook successfully extracts the `telegram_id` from the live payload
- ❌ The DB update happens
- ❌ The app sees `subscription_status = 'active'` and unlocks

**To verify:**

1. Use a 2nd Telegram account (or have a friend) with a different email
2. Open the app, get to paywall, tap Monthly $9.99, complete the Gumroad checkout with a real card
3. Watch Supabase `gumroad_events` table — should see the new row within seconds
4. Watch that user's `user_settings.subscription_status` — should flip to `active`
5. Back in their Telegram app, reload the mini app — banner should vanish, all + buttons should work
6. Refund the test purchase immediately afterward via Gumroad Sales → Refund

**If anything fails:** check Supabase Edge Function logs for `gumroad-webhook`. Most likely culprit is a payload shape difference (Gumroad changed field names) — adjust `extractTelegramId()` in the function.

**Do not advertise until this is green.**

---

## 🟡 Should do before TikTok / Instagram push

### Custom domain

You're on `habit-game-one.vercel.app` which screams "side project" in screenshots. Buy `getmomentum.app` or `momentumcore.app`.

1. Buy domain (Namecheap / Cloudflare / Porkbun — ~$12-30/yr)
2. Vercel project → Domains → Add → paste domain
3. Update DNS at registrar with Vercel's records (CNAME / A)
4. Wait 5-30 min for propagation
5. Update BotFather → `/myapps` → momentum → Edit Web App URL → new domain
6. Update `BOT_URL` in Supabase secrets (used by webhook for redirect — although in practice users come from t.me/... so they hit Telegram first)

### Evening Shutdown 3-card redesign

User shared a competitor reference with `WIN / CARRYOVER / TOMORROW PRIORITY` cards. They want this pattern. Current evening shutdown has 4 multi-step questions.

Decide: keep 4-step flow, or rebuild as inline 3-card form. Files to touch: `screens/RitualsScreen.tsx`, `components/RitualFlowSheet.tsx`. About 1-2 hours.

---

## 🟢 Deferred — do when you have real traffic or need

### Error tracking (Sentry)

When you start seeing real traffic, sign up at sentry.io (free tier: 5k errors/mo) and:

1. `npm install @sentry/react`
2. Init in `src/main.tsx`
3. Wrap `<App />` in `<Sentry.ErrorBoundary>`
4. Add `VITE_SENTRY_DSN` to Vercel env vars

30 min total when you need it.

### Stricter rate limits

Current limit is **in-memory per Edge Function instance**. Resets on cold start. Fine for low traffic.

When you have meaningful traffic (>1000 daily users), swap to a Supabase `rate_limits(user_id, window_start, request_count)` table OR front the function with Cloudflare.

### Backup strategy — Supabase Free tier

Free tier includes **daily automatic backups, retained for 7 days**.

- Dashboard → `habit-game` project → **Database** → **Backups** to view
- Restore requires Supabase support contact (paid plans get self-service)
- **Upgrade to Pro ($25/mo)** when you have paying users → adds point-in-time recovery for 7 days + 4-hour granularity for 30 days

### Push notifications

Habit reminders + evening shutdown nudge at 21:00. Needs:

- A bot backend (currently zero bot-server logic exists)
- A scheduled cron worker
- Telegram Bot API `sendMessage` calls
- `notification_settings` per user (already have `notifications jsonb` on `user_settings` — empty)

About 4-6 hours of work. Heavy ad-bait once shipped.

### Russian translation

User's `language_code` is `ru`. Most of the audience signal points at RU/CIS being the biggest market. Extract strings to a dictionary, switch by `profile.language_code`.

### AI features (ad bait)

- Weekly review with Claude auto-summary ("Here's what your week looked like: best habit was X, focus next week on Y")
- Habit insights ("You're 3× more likely to log this before 10am")

Each needs Anthropic API setup + ~2-3 hours of work. The Weekly Review one is the strongest ad-bait — auto-generated personalized content people screenshot and share.

### Admin panel for comp'd users

Currently you have to run SQL in Supabase Dashboard to grant free access. Build an in-app admin page (hidden behind your telegram_id) for managing this. ~1-2 hours.

---

## Compliance summary by region (informational, not legal advice)

- **GDPR (EU)** — covered. Data minimisation, access right, deletion right (via @momentumcore_bot DM), controller named in privacy policy.
- **CCPA (California)** — covered for the same reasons; not applicable since you're not selling data.
- **App store rules** — N/A. Telegram's own Mini App rules apply, no Apple/Google review.
- **Underage users** — Privacy Policy excludes <13. If marketing on TikTok where many users are teens, consider raising to 16 (some EU jurisdictions require).
- **Bot avatar** — custom design, copyright OK.
- **Latvian tax** — user is Latvian resident (residence permit). Gumroad as Merchant of Record handles VAT + sales tax everywhere; user is paid out from Gumroad minus their 5%+50¢ fee. User may still need to register their Gumroad income with Latvian SRS once accumulated (talk to a Latvian accountant when revenue > €5k/yr).

---

## When something goes wrong

| Symptom | Most likely cause | Fix |
|---|---|---|
| Users can't sign in | Edge function down or bot token rotated | Check Supabase edge function logs (`telegram-auth`) |
| Users see "stale_initData" | Their Telegram WebApp cached old auth | They reopen via `t.me/momentumcore_bot/momentum` — fresh initData |
| User sees someone else's data | RLS broken | **Stop everything.** Check policies, especially `app_user_id()`. Confirm JWT `sub` is `profiles.id` not `auth.users.id` |
| App stops loading | Vercel deploy failed | Vercel dashboard → Deployments → Roll back |
| Data lost | DB corruption / accidental delete | Supabase Dashboard → Backups → restore from last night (Free tier) or contact support |
| Paid user not unlocked | Webhook didn't fire OR telegram_id missing | Check `gumroad_events` for the recent sale row. If `telegram_id` is null, the customer hit the checkout without our query param — manually update `user_settings.subscription_status = 'active'` for them and add the link |
| Webhook events flooding | Gumroad replay or malicious POST | Webhook re-verifies via Gumroad API per event — fake POSTs are rejected. If real spam, add an IP allowlist for Gumroad's webhook IPs |
| Trial banner stuck on for paying user | Their cached settings query is stale | They tap "I just paid — refresh status" in the paywall, OR fully close + reopen the mini app |
| Gumroad refund issued | Customer requested refund | Webhook sets `subscription_status = 'expired'`. They keep app access read-only. If they want re-access without re-paying, manually comp via SQL |

---

## The single launch criterion

You can launch the moment **all of these are true**:

- ✅ App is live at a memorable URL (custom domain done OR you're OK with vercel.app)
- ❌ **One real $9.99 purchase succeeded and unlocked an account** (the only untested thing)
- ✅ Privacy + Terms reachable from BotFather and inside the app
- ✅ Bot avatar + splash + about set
- ✅ Trial + read-only gating verified
- ✅ Multi-user RLS verified

**Right now: 1 item blocking launch.** Do the test purchase.
