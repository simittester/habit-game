import { useLocation } from 'react-router-dom';
import type { Profile } from '../lib/auth';
import { tg } from '../lib/telegram';

interface Props { profile: Profile }

export function Header({ profile }: Props) {
  const location = useLocation();
  const title = (() => {
    if (location.pathname.startsWith('/more/')) return location.pathname.split('/').pop()?.replace('-', ' ').toUpperCase();
    if (location.pathname === '/today') return 'HABIT GAME';
    if (location.pathname === '/inbox') return 'HABIT GAME';
    if (location.pathname === '/habits') return 'HABIT GAME';
    if (location.pathname === '/progress') return 'HABIT GAME';
    if (location.pathname === '/more') return 'HABIT GAME';
    return 'HABIT GAME';
  })();

  return (
    <header className="flex items-center justify-between px-4 pt-3 pb-2 bg-bg sticky top-0 z-10">
      <div className="w-10" />
      <div className="text-center">
        <div className="text-[15px] font-bold tracking-wider">{title}</div>
        <div className="text-[11px] text-hint -mt-0.5">@{profile.username || 'mini app'}</div>
      </div>
      <button
        onClick={() => { tg.haptic('light'); tg.showAlert('Settings coming soon'); }}
        className="w-10 h-10 rounded-full flex items-center justify-center text-accent active:opacity-60"
        aria-label="Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8" cy="12" r="1.2" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
          <circle cx="16" cy="12" r="1.2" fill="currentColor"/>
        </svg>
      </button>
    </header>
  );
}
