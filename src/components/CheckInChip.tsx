import clsx from 'clsx';
import { tg } from '../lib/telegram';

interface Props {
  emoji: string;
  title: string;
  hint: string;
  onClick?: () => void;
  active?: boolean;
  done?: boolean;
}

export function CheckInChip({ emoji, title, hint, onClick, active, done }: Props) {
  return (
    <button
      onClick={() => { tg.haptic('light'); onClick?.(); }}
      className={clsx(
        'flex-shrink-0 w-[120px] rounded-2xl p-3 text-left transition active:scale-95',
        done
          ? 'bg-green-500/10 ring-1 ring-green-500/50'
          : active
            ? 'bg-bg-2 ring-2 ring-accent'
            : 'bg-bg-2',
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="text-[22px]">{emoji}</div>
        {done && <div className="text-[10px] text-green-400 font-semibold tracking-wider">DONE</div>}
      </div>
      <div className="text-[13px] font-semibold leading-tight">{title}</div>
      <div className={clsx('text-[11px] leading-tight mt-0.5', done ? 'text-green-400/80' : 'text-hint')}>{hint}</div>
    </button>
  );
}
