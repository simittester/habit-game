import { Check, Flame } from 'lucide-react';
import clsx from 'clsx';
import { tg } from '../lib/telegram';
import type { Habit } from '../types/db';

interface Props {
  habit: Habit;
  done: boolean;
  streak?: number;
  onToggle: () => void;
  onLongPress?: () => void;
}

export function HabitRow({ habit, done, streak = 0, onToggle }: Props) {
  return (
    <button
      onClick={() => { tg.haptic(done ? 'light' : 'medium'); onToggle(); }}
      className="w-full flex items-center gap-3 px-3 py-3 bg-bg-2 first:rounded-t-2xl last:rounded-b-2xl active:opacity-70 transition border-b border-divider last:border-b-0"
    >
      <div
        className={clsx(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition',
          done ? 'bg-accent border-accent' : 'border-white/25',
        )}
      >
        {done && <Check size={16} className="text-white" strokeWidth={3} />}
      </div>
      <div className="text-lg shrink-0">{habit.emoji || '🔥'}</div>
      <div className="flex-1 text-left">
        <div className={clsx('text-[15px] font-medium', done && 'line-through opacity-60')}>{habit.name}</div>
        <div className="text-[11px] text-hint capitalize">{habit.frequency}</div>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1 text-[12px] text-orange-300 bg-orange-500/15 rounded-full px-2 py-1">
          <Flame size={12} />
          <span>{streak}</span>
        </div>
      )}
    </button>
  );
}
