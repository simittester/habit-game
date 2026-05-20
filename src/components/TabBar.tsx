import { NavLink } from 'react-router-dom';
import { Sun, Inbox, Flame, LineChart, MoreHorizontal } from 'lucide-react';
import { tg } from '../lib/telegram';
import clsx from 'clsx';

const tabs = [
  { to: '/today', label: 'Today', Icon: Sun },
  { to: '/inbox', label: 'Inbox', Icon: Inbox },
  { to: '/habits', label: 'Habits', Icon: Flame },
  { to: '/progress', label: 'Progress', Icon: LineChart },
  { to: '/more', label: 'More', Icon: MoreHorizontal },
];

export function TabBar() {
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
