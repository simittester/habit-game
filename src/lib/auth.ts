import { authEndpoint, setAccessToken, supabaseAnonKey } from './supabase';
import { tg } from './telegram';

export interface Profile {
  id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
  is_premium: boolean;
  photo_url: string | null;
  timezone: string;
}

export interface AuthResult {
  access_token: string;
  expires_at: number;
  profile: Profile;
}

export async function signInWithTelegram(): Promise<AuthResult> {
  const initData = tg.initData();
  if (!initData) {
    throw new Error('NO_INIT_DATA');
  }
  const res = await fetch(authEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ initData }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AUTH_FAILED ${res.status} ${text}`);
  }
  const data = (await res.json()) as AuthResult;
  setAccessToken(data.access_token);
  localStorage.setItem('habit_game_profile', JSON.stringify(data.profile));
  localStorage.setItem('habit_game_jwt_exp', String(data.expires_at));
  return data;
}

export function getCachedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem('habit_game_profile');
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function isTokenValid(): boolean {
  try {
    const exp = Number(localStorage.getItem('habit_game_jwt_exp'));
    return Boolean(exp) && exp > Math.floor(Date.now() / 1000) + 60;
  } catch {
    return false;
  }
}

export function signOut() {
  setAccessToken(null);
  localStorage.removeItem('habit_game_profile');
  localStorage.removeItem('habit_game_jwt_exp');
}
