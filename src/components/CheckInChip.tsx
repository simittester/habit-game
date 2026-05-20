import clsx from 'clsx';
import { tg } from '../lib/telegram';

interface Props {
  emoji: string;
  title: string;
  hint: string;
  onClick?: () => void;
  active?: boolean;
}

export function CheckInChip({ emoji, title, hint, onClick, active }: Props) {
  return (
    <button
      onClick={() => { tg.haptic('light'); onClick?.(); }}
      className={clsx(
        'flex-shrink-0 w-[120px] bg-bg-2 rounded-2xl p-3 text-left active:scale-95 transition',
        active && 'ring-2 ring-accent',
      )}
    >
      <div className="text-[22px] mb-1">{emoji}</div>
      <div className="text-[13px] font-semibold leading-tight">{title}</div>
      <div className="text-[11px] text-hint leading-tight mt-0.5">{hint}</div>
    </button>
  );
}
