import { sb } from '../lib/supabase';

export interface AdminUserRow {
  user_id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
  photo_url: string | null;
  created_at: string;
  onboarded_at: string | null;
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
  subscription_tier: string | null;
  subscription_renews_at: string | null;
  trial_ends_at: string | null;
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await sb().rpc('is_admin');
  if (error) throw error;
  return Boolean(data);
}

export async function adminListUsers(limit = 200): Promise<AdminUserRow[]> {
  const { data, error } = await sb().rpc('admin_list_users', { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}

export async function adminSetSubscription(input: {
  user_id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  renews_at?: string | null;
}): Promise<void> {
  const { error } = await sb().rpc('admin_set_subscription', {
    p_user_id: input.user_id,
    p_status: input.status,
    p_renews_at: input.renews_at ?? null,
  });
  if (error) throw error;
}
