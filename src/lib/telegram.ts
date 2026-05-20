// Read directly from window.Telegram.WebApp (loaded via <script> tag in index.html)
// so we always see the latest state, not a cached snapshot from module-load time.

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
        };
        version?: string;
        platform?: string;
        colorScheme?: string;
        themeParams?: Record<string, string>;
        ready: () => void;
        expand: () => void;
        close: () => void;
        disableVerticalSwipes?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        showAlert: (message: string, cb?: () => void) => void;
        showConfirm: (message: string, cb?: (ok: boolean) => void) => void;
        HapticFeedback?: {
          impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid') => void;
          notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged?: () => void;
        };
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
      };
    };
  }
}

type Hap = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';

function wa() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
}

let initialized = false;

export function initTelegram() {
  if (initialized) return;
  const w = wa();
  if (!w) return;
  try {
    w.ready();
    w.expand();
    w.disableVerticalSwipes?.();
    w.setHeaderColor?.('#0b0b0d');
    w.setBackgroundColor?.('#0b0b0d');
    initialized = true;
  } catch { /* not in Telegram */ }
}

export const tg = {
  webApp: () => wa(),
  initData: (): string => wa()?.initData || '',
  user: () => wa()?.initDataUnsafe?.user ?? null,
  isTelegram: (): boolean => Boolean(wa()?.initData),
  haptic: (kind: Hap = 'light') => { try { wa()?.HapticFeedback?.impactOccurred?.(kind); } catch { /* noop */ } },
  notify: (kind: 'success' | 'warning' | 'error' = 'success') => { try { wa()?.HapticFeedback?.notificationOccurred?.(kind); } catch { /* noop */ } },
  selection: () => { try { wa()?.HapticFeedback?.selectionChanged?.(); } catch { /* noop */ } },
  showAlert: (msg: string) => { try { wa()?.showAlert(msg); } catch { alert(msg); } },
  showConfirm: (msg: string) => new Promise<boolean>((resolve) => {
    try { wa()?.showConfirm(msg, (ok) => resolve(ok)); } catch { resolve(confirm(msg)); }
  }),
  diagnostic: () => {
    const w = wa();
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(0, 80) : '';
    return {
      hasTelegram: typeof window !== 'undefined' && Boolean(window.Telegram),
      hasWebApp: Boolean(w),
      hasInitData: Boolean(w?.initData),
      initDataLen: (w?.initData || '').length,
      version: w?.version,
      platform: w?.platform,
      user: w?.initDataUnsafe?.user ? `${w.initDataUnsafe.user.first_name ?? ''} (${w.initDataUnsafe.user.id})` : null,
      urlHashPreview: hash,
    };
  },
};
