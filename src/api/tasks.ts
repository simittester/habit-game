import { sb } from '../lib/supabase';
import { todayIso } from '../lib/dates';
import type { Task } from '../types/db';

export async function listOpenTasks(): Promise<Task[]> {
  const { data, error } = await sb()
    .from('tasks')
    .select('*')
    .eq('status', 'open')
    .order('priority', { ascending: false })
    .order('scheduled_for', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Task[];
}

export async function listTodayTasks(): Promise<Task[]> {
  const today = todayIso();
  const { data, error } = await sb()
    .from('tasks')
    .select('*')
    .or(`scheduled_for.eq.${today},and(scheduled_for.is.null,status.eq.open,priority.gte.1)`)
    .order('priority', { ascending: false })
    .order('status', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Task[];
}

export async function listTopPriorities(): Promise<Task[]> {
  const { data, error } = await sb()
    .from('tasks')
    .select('*')
    .gte('priority', 1)
    .eq('status', 'open')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(5);
  if (error) throw error;
  return data as Task[];
}

export async function createTask(input: {
  title: string;
  priority?: number;
  scheduled_for?: string | null;
  due_date?: string | null;
  project_id?: string | null;
  area_id?: string | null;
  notes?: string | null;
}): Promise<Task> {
  const { data, error } = await sb()
    .from('tasks')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const { error } = await sb().from('tasks').update(patch).eq('id', id);
  if (error) throw error;
}

export async function toggleTaskDone(t: Task): Promise<void> {
  if (t.status === 'done') {
    await updateTask(t.id, { status: 'open', completed_at: null });
  } else {
    await updateTask(t.id, { status: 'done', completed_at: new Date().toISOString() });
  }
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await sb().from('tasks').delete().eq('id', id);
  if (error) throw error;
}
