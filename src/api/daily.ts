import { sb } from '../lib/supabase';
import { todayIso } from '../lib/dates';
import type { WaterLog, Meal, Expense, DailySummary, MealType } from '../types/db';

// --- Water ---
export async function getWaterToday(): Promise<WaterLog | null> {
  const { data, error } = await sb()
    .from('water_logs')
    .select('*')
    .eq('log_date', todayIso())
    .maybeSingle();
  if (error) throw error;
  return data as WaterLog | null;
}

export async function setWater(glasses: number, target = 8): Promise<WaterLog> {
  const profile = JSON.parse(localStorage.getItem('habit_game_profile') || '{}');
  const { data, error } = await sb()
    .from('water_logs')
    .upsert(
      { user_id: profile.id, log_date: todayIso(), glasses: Math.max(0, glasses), target },
      { onConflict: 'user_id,log_date' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as WaterLog;
}

// --- Meals ---
export async function listMealsForDate(date = todayIso()): Promise<Meal[]> {
  const { data, error } = await sb()
    .from('meals')
    .select('*')
    .eq('log_date', date)
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return data as Meal[];
}

export async function addMeal(input: { name: string; meal_type?: MealType; calories?: number; notes?: string; log_date?: string }): Promise<Meal> {
  const { data, error } = await sb()
    .from('meals')
    .insert({ ...input, log_date: input.log_date ?? todayIso() })
    .select('*')
    .single();
  if (error) throw error;
  return data as Meal;
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await sb().from('meals').delete().eq('id', id);
  if (error) throw error;
}

// --- Expenses ---
export async function listExpensesForDate(date = todayIso()): Promise<Expense[]> {
  const { data, error } = await sb()
    .from('expenses')
    .select('*')
    .eq('log_date', date)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

export async function listRecentExpenses(days = 7): Promise<Expense[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await sb()
    .from('expenses')
    .select('*')
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

export async function addExpense(input: { amount: number; category?: string; note?: string; currency?: string; emoji?: string; log_date?: string }): Promise<Expense> {
  const { data, error } = await sb()
    .from('expenses')
    .insert({ ...input, log_date: input.log_date ?? todayIso() })
    .select('*')
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await sb().from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// --- Summary / score ---
export async function fetchSummary(days = 7): Promise<DailySummary[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const { data, error } = await sb()
    .from('daily_summary')
    .select('*')
    .gte('day', since.toISOString().slice(0, 10))
    .order('day', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DailySummary[];
}

export async function fetchScoreFor(date: string): Promise<number> {
  const { data, error } = await sb().rpc('daily_score', { d: date });
  if (error) throw error;
  return (data ?? 0) as number;
}
