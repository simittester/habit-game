import { sb } from '../lib/supabase';
import type { UserSettings } from '../types/db';

export async function getSettings(): Promise<UserSettings | null> {
  const { data, error } = await sb()
    .from('user_settings')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as UserSettings | null;
}

export async function upsertSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const { data, error } = await sb()
    .from('user_settings')
    .upsert(patch as Record<string, unknown>, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data as UserSettings;
}
