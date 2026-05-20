import { useEffect, useState } from 'react';
import { getCachedProfile, isTokenValid, signInWithTelegram, type Profile } from '../lib/auth';
import { restoreToken } from '../lib/supabase';
import { initTelegram, tg } from '../lib/telegram';

export type AuthState =
  | { status: 'loading' }
  | { status: 'ready'; profile: Profile }
  | { status: 'error'; message: string; diagnostic?: ReturnType<typeof tg.diagnostic> };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const tryAuth = async () => {
      initTelegram();
      restoreToken();

      const cached = getCachedProfile();
      let hasInit = Boolean(tg.initData());

      // If we have a cached valid token + profile, use it immediately while refreshing in background
      if (cached && isTokenValid()) {
        if (!cancelled) setState({ status: 'ready', profile: cached });
        if (hasInit) {
          signInWithTelegram()
            .then((r) => { if (!cancelled) setState({ status: 'ready', profile: r.profile }); })
            .catch(() => { /* keep cached */ });
        }
        return;
      }

      // Telegram WebApp script may set initData slightly after page load — retry a few times
      for (let i = 0; i < 8 && !hasInit; i++) {
        await new Promise((r) => setTimeout(r, 150));
        initTelegram();
        hasInit = Boolean(tg.initData());
      }

      if (!hasInit) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: 'Open this app inside Telegram. (No initData found.)',
            diagnostic: tg.diagnostic(),
          });
        }
        return;
      }

      signInWithTelegram()
        .then((r) => { if (!cancelled) setState({ status: 'ready', profile: r.profile }); })
        .catch((e: Error) => {
          if (!cancelled) setState({
            status: 'error',
            message: e.message,
            diagnostic: tg.diagnostic(),
          });
        });
    };

    tryAuth();
    return () => { cancelled = true; };
  }, []);

  return state;
}
