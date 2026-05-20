import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _client: SupabaseClient | null = null;
let _accessToken: string | null = null;

function buildClient(token: string | null): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
  _client = buildClient(token);
  if (token) localStorage.setItem('habit_game_jwt', token);
  else localStorage.removeItem('habit_game_jwt');
}

export function restoreToken(): string | null {
  try {
    const t = localStorage.getItem('habit_game_jwt');
    if (t) {
      _accessToken = t;
      _client = buildClient(t);
    }
    return t;
  } catch {
    return null;
  }
}

export function sb(): SupabaseClient {
  if (!_client) _client = buildClient(_accessToken);
  return _client;
}

export const authEndpoint = `${SUPABASE_URL}/functions/v1/telegram-auth`;
export const supabaseAnonKey = SUPABASE_ANON;
