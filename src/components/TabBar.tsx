import { NavLink } from 'react-router-dom';
import { Sun, Inbox, Flame, LineChart, MoreHorizontal } from 'lucide-react';
import { tg } from '../lib/telegram';
import { useT } from '../i18n';
import clsx from 'clsx';

export function TabBar() {
  const { t } = useT();
  const tabs = [
    { to: '/today', label: t.tab.today, Icon: Sun },
    { to: '/inbox', label: t.tab.inbox, Icon: Inbox },
    { to: '/habits', label: t.tab.habits, Icon: Flame },
    { to: '/progress', label: t.tab.progress, Icon: LineChart },
    { to: '/more', label: t.tab.more, Icon: MoreHorizontal },
  ];
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-bg/85 backdrop-blur-xl border-t border-divider px-2 pt-2 z-20"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <ul className="grid grid-cols-5 gap-1">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={() => tg.selection()}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-1 rounded-lg active:opacity-60 transition',
                  isActive ? 'text-accent' : 'text-hint',
                )
              }
            >
              <Icon size={22} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
