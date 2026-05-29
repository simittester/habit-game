import { sb } from '../lib/supabase';
import type { Area, Project, Review, ReviewKind } from '../types/db';
import { todayIso } from '../lib/dates';

// --- Areas ---
export async function listAreas(): Promise<Area[]> {
  const { data, error } = await sb()
    .from('areas')
    .select('*')
    .eq('archived', false)
    .order('position', { ascending: true });
  if (error) throw error;
  return data as Area[];
}

export async function createArea(input: { name: string; emoji?: string; color?: string; description?: string }): Promise<Area> {
  const { data, error } = await sb().from('areas').insert(input).select('*').single();
  if (error) throw error;
  return data as Area;
}

export async function deleteArea(id: string): Promise<void> {
  const { error } = await sb().from('areas').delete().eq('id', id);
  if (error) throw error;
}

// --- Projects ---
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await sb()
    .from('projects')
    .select('*')
    .neq('status', 'archived')
    .order('status', { ascending: true })
    .order('position', { ascending: true });
  if (error) throw error;
  return data as Project[];
}

export async function createProject(input: { name: string; emoji?: string; color?: string; area_id?: string; description?: string; due_date?: string }): Promise<Project> {
  const { data, error } = await sb().from('projects').insert(input).select('*').single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<void> {
  const { error } = await sb().from('projects').update(patch).eq('id', id);
  if (error) throw error;
}

export async function completeProject(id: string): Promise<void> {
  const { error } = await sb()
    .from('projects')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await sb().from('projects').delete().eq('id', id);
  if (error) throw error;
}

// --- Reviews ---
export async function listReviews(limit = 100): Promise<Review[]> {
  const { data, error } = await sb()
    .from('reviews')
    .select('*')
    .order('review_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Review[];
}

export async function getReviewByDate(date: string, kind: ReviewKind): Promise<Review | null> {
  const { data, error } = await sb()
    .from('reviews')
    .select('*')
    .eq('review_date', date)
    .eq('kind', kind)
    .maybeSingle();
  if (error) throw error;
  return data as Review | null;
}

export async function upsertReview(input: {
  review_date?: string;
  kind?: ReviewKind;
  highlights?: string;
  lowlights?: string;
  lessons?: string;
  next_focus?: string;
  score?: number;
}): Promise<Review> {
  const profile = JSON.parse(localStorage.getItem('habit_game_profile') || '{}');
  const payload = {
    user_id: profile.id,
    review_date: input.review_date ?? todayIso(),
    kind: input.kind ?? 'daily',
    ...input,
  };
  const { data, error } = await sb()
    .from('reviews')
    .upsert(payload, { onConflict: 'user_id,review_date,kind' })
    .select('*')
    .single();
  if (error) throw error;
  return data as Review;
}

