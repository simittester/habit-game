-- Push notifications infrastructure.
-- Enables pg_cron + pg_net so a Postgres job can fire the edge function which
-- sends Telegram messages. Cron schedule is NOT created here on purpose; create
-- it manually after smoke-testing the edge function. Command at the bottom.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- User-tunable notification preferences.
alter table public.user_settings
  add column if not exists notify_evening_shutdown boolean not null default true;
alter table public.user_settings
  add column if not exists notify_evening_hour integer not null default 21
    check (notify_evening_hour between 0 and 23);
alter table public.user_settings
  add column if not exists notify_habit_reminders boolean not null default true;

-- Audit + dedup. The unique constraint guarantees we only send each
-- (user, kind, ref, day) combo once. The edge function inserts here BEFORE
-- calling Telegram and bails on conflict.
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('evening_shutdown', 'habit_reminder')),
  ref_id uuid,
  sent_for_date date not null,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, ref_id, sent_for_date)
);

-- Lock down notification_log: no client access. Only service role writes.
alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;

-- Index used by the edge function to look up recent sends quickly.
create index if not exists notification_log_user_date_idx
  on public.notification_log (user_id, sent_for_date);

-- Manual cron-setup snippet (run after edge function is deployed + tested):
--
--   select cron.schedule(
--     'momentum-notify-tick',
--     '*/5 * * * *',
--     $cron$
--       select net.http_post(
--         url := 'https://bmincaoicwpdqifkyazb.supabase.co/functions/v1/notify-tick',
--         headers := jsonb_build_object(
--           'Content-Type', 'application/json',
--           'X-Notify-Secret', current_setting('app.notify_secret', true)
--         ),
--         body := '{}'::jsonb,
--         timeout_milliseconds := 30000
--       );
--     $cron$
--   );
--
-- And set the shared secret as a DB-level setting once:
--   alter database postgres set app.notify_secret to '<paste from supabase secret NOTIFY_SECRET>';
