import { sb } from '../lib/supabase';
import { todayIso } from '../lib/dates';
import type { TimeBlock } from '../types/db';

export async function listBlocksForDate(date = todayIso()): Promise<TimeBlock[]> {
  const { data, error } = await sb()
    .from('time_blocks')
    .select('*')
    .eq('block_date', date)
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data as TimeBlock[];
}

export async function createTimeBlock(input: {
  block_date: string;
  start_time: string;
  duration_minutes: number;
  title: string;
  emoji?: string;
  color?: string;
}): Promise<TimeBlock> {
  const { data, error } = await sb()
    .from('time_blocks')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as TimeBlock;
}

export async function toggleBlock(id: string, completed: boolean): Promise<void> {
  const { error } = await sb()
    .from('time_blocks')
    .update({ completed })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteBlock(id: string): Promise<void> {
  const { error } = await sb().from('time_blocks').delete().eq('id', id);
  if (error) throw error;
}
