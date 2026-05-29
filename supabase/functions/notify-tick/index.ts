// Notification dispatcher — called by pg_cron every 5 minutes.
// For each user with notifications enabled, computes their local time, finds
// any due reminders (evening shutdown at user-configured local hour, habit
// reminders at configured times), dedups via notification_log, then sends via
// Telegram Bot API.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const NOTIFY_SECRET = Deno.env.get('NOTIFY_SECRET') ?? '';
const BOT_URL = Deno.env.get('BOT_URL') ?? 'https://t.me/momentumcore_bot/momentum';

type Lang = 'en' | 'ru';

interface UserRow {
  user_id: string;
  notify_evening_shutdown: boolean;
  notify_evening_hour: number;
  notify_habit_reminders: boolean;
  language: Lang | null;
  profiles: {
    telegram_id: number;
    timezone: string | null;
    first_name: string | null;
    language_code: string | null;
  };
}

interface HabitRow {
  id: string;
  name: string;
  emoji: string | null;
  reminder_time: string; // 'HH:MM' or 'HH:MM:SS'
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!NOTIFY_SECRET || req.headers.get('X-Notify-Secret') !== NOTIFY_SECRET) {
    return new Response('unauthorized', { status: 401 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Pull every user whose notifications might fire. Cheap because users are
  // small. The inner loop does the per-user time-zone math.
  const { data: users, error: usersErr } = await sb
    .from('user_settings')
    .select(`
      user_id,
      notify_evening_shutdown,
      notify_evening_hour,
      notify_habit_reminders,
      language,
      profiles!inner ( telegram_id, timezone, first_name, language_code )
    `)
    .or('notify_evening_shutdown.eq.true,notify_habit_reminders.eq.true')
    .returns<UserRow[]>();

  if (usersErr) {
    return json({ ok: false, error: 'users_query_failed', detail: usersErr.message }, 500);
  }

  let evening = 0;
  let habit = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const u of users ?? []) {
    if (!u.profiles?.telegram_id) { skipped++; continue; }
    const tz = u.profiles.timezone || 'UTC';
    const local = localTimeIn(tz, new Date());
    if (!local) { skipped++; continue; }
    const lang = resolveLang(u.language, u.profiles.language_code);

    // 1) Evening shutdown nudge.
    if (u.notify_evening_shutdown && local.hour === u.notify_evening_hour && local.minute < 5) {
      const already = await reviewDoneToday(sb, u.user_id, local.dateIso);
      if (!already) {
        const ok = await tryDispatch({
          sb,
          chat_id: u.profiles.telegram_id,
          user_id: u.user_id,
          kind: 'evening_shutdown',
          ref_id: null,
          sent_for_date: local.dateIso,
          text: messages.eveningShutdown(lang, u.profiles.first_name),
        });
        if (ok === 'sent') evening++;
        else if (ok === 'error') errors.push(`evening:${u.user_id}`);
      }
    }

    // 2) Habit reminders.
    if (u.notify_habit_reminders) {
      const { data: habits, error: hErr } = await sb
        .from('habits')
        .select('id, name, emoji, reminder_time')
        .eq('user_id', u.user_id)
        .eq('archived', false)
        .not('reminder_time', 'is', null)
        .returns<HabitRow[]>();
      if (hErr) { errors.push(`habits:${u.user_id}`); continue; }

      for (const h of habits ?? []) {
        if (!matchesNow(h.reminder_time, local)) continue;
        const logged = await habitLoggedToday(sb, h.id, local.dateIso);
        if (logged) continue;
        const ok = await tryDispatch({
          sb,
          chat_id: u.profiles.telegram_id,
          user_id: u.user_id,
          kind: 'habit_reminder',
          ref_id: h.id,
          sent_for_date: local.dateIso,
          text: messages.habitReminder(lang, h.name, h.emoji),
        });
        if (ok === 'sent') habit++;
        else if (ok === 'error') errors.push(`habit:${u.user_id}:${h.id}`);
      }
    }
  }

  return json({ ok: true, evening, habit, skipped, errors });
});

/* ------------------------- helpers ------------------------- */

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
  });
}

function resolveLang(override: Lang | null, profileLang: string | null | undefined): Lang {
  if (override === 'en' || override === 'ru') return override;
  if ((profileLang ?? '').toLowerCase().startsWith('ru')) return 'ru';
  return 'en';
}

interface LocalParts { hour: number; minute: number; dateIso: string }

function localTimeIn(tz: string, at: Date): LocalParts | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts: Record<string, string> = {};
    for (const p of fmt.formatToParts(at)) if (p.type !== 'literal') parts[p.type] = p.value;
    const hour = Number(parts.hour);
    const minute = Number(parts.minute);
    const dateIso = `${parts.year}-${parts.month}-${parts.day}`;
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return { hour: hour === 24 ? 0 : hour, minute, dateIso };
  } catch {
    return null;
  }
}

function matchesNow(reminder: string, now: LocalParts): boolean {
  const [hStr, mStr] = reminder.split(':');
  const rh = Number(hStr);
  const rm = Number(mStr);
  if (Number.isNaN(rh) || Number.isNaN(rm)) return false;
  if (rh !== now.hour) return false;
  // Cron fires every 5 min. Fire when current minute is within [rm, rm+5).
  return now.minute >= rm && now.minute < rm + 5;
}

async function reviewDoneToday(sb: ReturnType<typeof createClient>, user_id: string, dateIso: string): Promise<boolean> {
  const { data } = await sb
    .from('reviews')
    .select('id')
    .eq('user_id', user_id)
    .eq('kind', 'daily')
    .eq('review_date', dateIso)
    .maybeSingle();
  return Boolean(data);
}

async function habitLoggedToday(sb: ReturnType<typeof createClient>, habit_id: string, dateIso: string): Promise<boolean> {
  const { data } = await sb
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habit_id)
    .eq('log_date', dateIso)
    .maybeSingle();
  return Boolean(data);
}

type DispatchResult = 'sent' | 'duplicate' | 'error';

async function tryDispatch(args: {
  sb: ReturnType<typeof createClient>;
  chat_id: number;
  user_id: string;
  kind: 'evening_shutdown' | 'habit_reminder';
  ref_id: string | null;
  sent_for_date: string;
  text: string;
}): Promise<DispatchResult> {
  // Claim the slot first. If conflict, we already sent this combo — bail.
  const { data: claim, error } = await args.sb
    .from('notification_log')
    .insert({
      user_id: args.user_id,
      kind: args.kind,
      ref_id: args.ref_id,
      sent_for_date: args.sent_for_date,
    })
    .select('id')
    .maybeSingle();
  if (error || !claim) return 'duplicate';

  // Send the Telegram message. Failure here leaves the log row in place — we
  // accept under-delivery over double-delivery.
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: args.chat_id,
    text: args.text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: 'Open Momentum', url: BOT_URL }]],
    },
  };
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return 'error';
    return 'sent';
  } catch {
    return 'error';
  }
}

/* ------------------------- copy ------------------------- */

const messages = {
  eveningShutdown(lang: Lang, name: string | null): string {
    const nm = (name ?? '').trim();
    if (lang === 'ru') {
      return `🌙 Время вечернего разбора${nm ? `, ${escapeHtml(nm)}` : ''}.\n\nЗакрой день: один WIN, один CARRYOVER, один приоритет на завтра.`;
    }
    return `🌙 Evening shutdown${nm ? `, ${escapeHtml(nm)}` : ''}.\n\nClose the day clean — one WIN, one CARRYOVER, tomorrow's priority.`;
  },
  habitReminder(lang: Lang, habit: string, emoji: string | null): string {
    const ico = emoji && emoji.trim().length > 0 ? emoji : '🔥';
    const safe = escapeHtml(habit);
    if (lang === 'ru') {
      return `${ico} Напоминание: <b>${safe}</b>\n\nОтметь привычку как выполненную, чтобы сохранить серию.`;
    }
    return `${ico} Reminder: <b>${safe}</b>\n\nTap to log it and keep your streak alive.`;
  },
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
