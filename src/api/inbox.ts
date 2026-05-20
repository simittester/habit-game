import { sb } from '../lib/supabase';
import type { InboxItem } from '../types/db';

export async function listInbox(): Promise<InboxItem[]> {
  const { data, error } = await sb()
    .from('inbox_items')
    .select('*')
    .order('processed', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as InboxItem[];
}

export async function createInboxItem(content: string): Promise<InboxItem> {
  const { data, error } = await sb()
    .from('inbox_items')
    .insert({ content })
    .select('*')
    .single();
  if (error) throw error;
  return data as InboxItem;
}

export async function deleteInboxItem(id: string): Promise<void> {
  const { error } = await sb().from('inbox_items').delete().eq('id', id);
  if (error) throw error;
}

export async function markInboxProcessed(id: string, promoted?: { kind: string; id: string }): Promise<void> {
  const { error } = await sb()
    .from('inbox_items')
    .update({
      processed: true,
      promoted_to: promoted?.kind ?? null,
      promoted_id: promoted?.id ?? null,
    })
    .eq('id', id);
  if (error) throw error;
}
