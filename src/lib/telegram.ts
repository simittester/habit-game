import WebApp from '@twa-dev/sdk';

type Hap = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';

let initialized = false;

export function initTelegram() {
  if (initialized) return;
  try {
    WebApp.ready();
    WebApp.expand();
    WebApp.disableVerticalSwipes?.();
    WebApp.setHeaderColor?.('#0b0b0d');
    WebApp.setBackgroundColor?.('#0b0b0d');
    initialized = true;
  } catch {
    /* not in Telegram (browser preview) */
  }
}

export const tg = {
  webApp: WebApp,
  initData: (): string => {
    try {
      return WebApp.initData || '';
    } catch {
      return '';
    }
  },
  user: () => {
    try {
      return WebApp.initDataUnsafe?.user ?? null;
    } catch {
      return null;
    }
  },
  isTelegram: (): boolean => {
    try {
      return Boolean(WebApp.initData);
    } catch {
      return false;
    }
  },
  haptic: (kind: Hap = 'light') => {
    try {
      WebApp.HapticFeedback?.impactOccurred?.(kind);
    } catch { /* noop */ }
  },
  notify: (kind: 'success' | 'warning' | 'error' = 'success') => {
    try {
      WebApp.HapticFeedback?.notificationOccurred?.(kind);
    } catch { /* noop */ }
  },
  selection: () => {
    try {
      WebApp.HapticFeedback?.selectionChanged?.();
    } catch { /* noop */ }
  },
  showAlert: (msg: string) => {
    try { WebApp.showAlert(msg); } catch { alert(msg); }
  },
  showConfirm: (msg: string) => new Promise<boolean>((resolve) => {
    try { WebApp.showConfirm(msg, (ok) => resolve(ok)); } catch { resolve(confirm(msg)); }
  }),
};
