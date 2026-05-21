import { sb } from '../lib/supabase';
import { todayIso } from '../lib/dates';
import type { WeightLog } from '../types/db';

export async function listWeightLogs(days = 90): Promise<WeightLog[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const { data, error } = await sb()
    .from('weight_logs')
    .select('*')
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WeightLog[];
}

export async function upsertWeight(weight_kg: number, note?: string, log_date?: string): Promise<WeightLog> {
  const profile = JSON.parse(localStorage.getItem('habit_game_profile') || '{}');
  const { data, error } = await sb()
    .from('weight_logs')
    .upsert(
      {
        user_id: profile.id,
        log_date: log_date ?? todayIso(),
        weight_kg,
        note: note ?? null,
      },
      { onConflict: 'user_id,log_date' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as WeightLog;
}

export async function deleteWeightLog(id: string): Promise<void> {
  const { error } = await sb().from('weight_logs').delete().eq('id', id);
  if (error) throw error;
}

export function bmi(weight_kg: number, height_cm: number): number {
  if (!height_cm || height_cm <= 0) return 0;
  const m = height_cm / 100;
  return weight_kg / (m * m);
}

export function bmiBucket(value: number): { label: string; color: string } {
  if (value === 0) return { label: '—', color: 'text-hint' };
  if (value < 18.5) return { label: 'Under', color: 'text-blue-300' };
  if (value < 25) return { label: 'Healthy', color: 'text-green-400' };
  if (value < 30) return { label: 'Over', color: 'text-amber-300' };
  return { label: 'Obese', color: 'text-red-400' };
}
