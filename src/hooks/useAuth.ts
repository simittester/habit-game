import { useEffect, useState } from 'react';
import { getCachedProfile, isTokenValid, signInWithTelegram, type Profile } from '../lib/auth';
import { restoreToken } from '../lib/supabase';
import { initTelegram, tg } from '../lib/telegram';

export type AuthState =
  | { status: 'loading' }
  | { status: 'ready'; profile: Profile }
  | { status: 'error'; message: string };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    initTelegram();
    restoreToken();

    const cached = getCachedProfile();
    const hasInit = Boolean(tg.initData());

    // If we have a cached valid token + profile, use it immediately while refreshing in background
    if (cached && isTokenValid()) {
      setState({ status: 'ready', profile: cached });
      // Optional background refresh
      if (hasInit) {
        signInWithTelegram()
          .then((r) => setState({ status: 'ready', profile: r.profile }))
          .catch(() => { /* keep cached */ });
      }
      return;
    }

    if (!hasInit) {
      setState({
        status: 'error',
        message: 'Open this app inside Telegram. (No initData found in browser preview.)',
      });
      return;
    }

    signInWithTelegram()
      .then((r) => setState({ status: 'ready', profile: r.profile }))
      .catch((e: Error) => setState({ status: 'error', message: e.message }));
  }, []);

  return state;
}
