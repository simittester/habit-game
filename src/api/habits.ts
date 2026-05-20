import { sb } from '../lib/supabase';
import { todayIso } from '../lib/dates';
import type { Habit, HabitLog, Frequency } from '../types/db';

export async function listHabits(): Promise<Habit[]> {
  const { data, error } = await sb()
    .from('habits')
    .select('*')
    .eq('archived', false)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Habit[];
}

export async function createHabit(input: {
  name: string;
  frequency: Frequency;
  emoji?: string;
  color?: string;
  target_per_day?: number;
  description?: string;
  area_id?: string;
  custom_days?: number[];
}): Promise<Habit> {
  const { data, error } = await sb()
    .from('habits')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function updateHabit(id: string, patch: Partial<Habit>): Promise<void> {
  const { error } = await sb().from('habits').update(patch).eq('id', id);
  if (error) throw error;
}

export async function archiveHabit(id: string): Promise<void> {
  await updateHabit(id, { archived: true });
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await sb().from('habits').delete().eq('id', id);
  if (error) throw error;
}

export async function listHabitLogs(habitId: string, days = 60): Promise<HabitLog[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await sb()
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: false });
  if (error) throw error;
  return data as HabitLog[];
}

export async function listTodayLogs(): Promise<HabitLog[]> {
  const { data, error } = await sb()
    .from('habit_logs')
    .select('*')
    .eq('log_date', todayIso());
  if (error) throw error;
  return data as HabitLog[];
}

export async function toggleHabitToday(habitId: string, currentlyDone: boolean): Promise<void> {
  if (currentlyDone) {
    const { error } = await sb()
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('log_date', todayIso());
    if (error) throw error;
  } else {
    // upsert ignoring user_id (RLS forbids cross-user)
    const profile = JSON.parse(localStorage.getItem('habit_game_profile') || '{}');
    const { error } = await sb()
      .from('habit_logs')
      .upsert(
        { habit_id: habitId, log_date: todayIso(), count: 1, user_id: profile.id },
        { onConflict: 'habit_id,log_date' },
      );
    if (error) throw error;
  }
}

export async function habitStreak(habitId: string): Promise<number> {
  const { data, error } = await sb().rpc('habit_streak', { habit: habitId });
  if (error) throw error;
  return (data ?? 0) as number;
}

export async function listHabitStreaks(): Promise<Map<string, number>> {
  const { data, error } = await sb().rpc('habit_streaks');
  if (error) throw error;
  const map = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ habit_id: string; streak: number }>) {
    map.set(row.habit_id, row.streak ?? 0);
  }
  return map;
}

export function isHabitDueToday(h: Habit, date = new Date()): boolean {
  const dow = date.getDay(); // 0..6 Sun..Sat
  const isoDow = dow === 0 ? 7 : dow; // 1..7 Mon..Sun
  switch (h.frequency) {
    case 'daily': return true;
    case 'weekdays': return isoDow >= 1 && isoDow <= 5;
    case 'weekends': return isoDow >= 6;
    case 'custom': return Boolean(h.custom_days?.includes(dow));
  }
}
