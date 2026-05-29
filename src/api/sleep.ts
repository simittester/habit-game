import { sb } from '../lib/supabase';
import { todayIso } from '../lib/dates';
import type { SleepLog } from '../types/db';

/** Compute hours between bedtime and wake_time, handling overnight wrap. */
export function computeSleepHours(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  // If wake is earlier than bedtime (clock-wise), assume overnight
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  const minutes = wakeMin - bedMin;
  return Math.round((minutes / 60) * 10) / 10;
}

export async function getSleepToday(): Promise<SleepLog | null> {
  const { data, error } = await sb()
    .from('sleep_logs')
    .select('*')
    .eq('log_date', todayIso())
    .maybeSingle();
  if (error) throw error;
  return data as SleepLog | null;
}

export async function listSleepLogs(days = 90): Promise<SleepLog[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const { data, error } = await sb()
    .from('sleep_logs')
    .select('*')
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SleepLog[];
}

export async function upsertSleep(input: {
  log_date?: string;
  hours: number;
  bedtime?: string | null;
  wake_time?: string | null;
  quality?: number | null;
  note?: string | null;
}): Promise<SleepLog> {
  const profile = JSON.parse(localStorage.getItem('habit_game_profile') || '{}');
  const { data, error } = await sb()
    .from('sleep_logs')
    .upsert(
      {
        user_id: profile.id,
        log_date: input.log_date ?? todayIso(),
        hours: input.hours,
        bedtime: input.bedtime ?? null,
        wake_time: input.wake_time ?? null,
        quality: input.quality ?? null,
        note: input.note?.trim() || null,
      },
      { onConflict: 'user_id,log_date' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as SleepLog;
}

export async function deleteSleepLog(id: string): Promise<void> {
  const { error } = await sb().from('sleep_logs').delete().eq('id', id);
  if (error) throw error;
}
