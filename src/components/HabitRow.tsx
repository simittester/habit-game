import { useEffect, useState } from 'react';
import { Check, Flame, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { tg } from '../lib/telegram';
import { Confetti } from './Confetti';
import type { Habit } from '../types/db';

interface Props {
  habit: Habit;
  done: boolean;
  streak?: number;
  onToggle: () => void;
  onTap?: () => void;
  showChevron?: boolean;
}

function streakStyle(streak: number) {
  if (streak >= 100) return { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-300', label: 'legend', big: true };
  if (streak >= 30) return { bg: 'bg-amber-400/15', text: 'text-amber-300', label: 'month', big: true };
  if (streak >= 7) return { bg: 'bg-orange-500/15', text: 'text-orange-300', label: 'week', big: false };
  return { bg: 'bg-orange-500/10', text: 'text-orange-300/90', label: '', big: false };
}

export function HabitRow({ habit, done, streak = 0, onToggle, onTap, showChevron }: Props) {
  const [popKey, setPopKey] = useState(0);
  const [burst, setBurst] = useState<number | null>(null);
  const [prevDone, setPrevDone] = useState(done);

  useEffect(() => {
    if (!prevDone && done) {
      const isMilestone = streak === 7 || streak === 30 || streak === 100;
      if (isMilestone || streak === 1) setBurst(Date.now());
    }
    setPrevDone(done);
  }, [done, streak, prevDone]);

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    tg.haptic(done ? 'light' : 'medium');
    setPopKey((k) => k + 1);
    onToggle();
  };

  const handleRow = () => {
    if (onTap) {
      tg.haptic('light');
      onTap();
    } else {
      tg.haptic(done ? 'light' : 'medium');
      setPopKey((k) => k + 1);
      onToggle();
    }
  };

  const st = streakStyle(streak);

  return (
    <div
      onClick={handleRow}
      className="relative w-full flex items-center gap-3 px-3 py-3 bg-bg-2 first:rounded-t-2xl last:rounded-b-2xl active:opacity-70 transition border-b border-divider last:border-b-0 cursor-pointer"
    >
      <button
        onClick={handleCheck}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        key={popKey}
        className={clsx(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition',
          done ? 'bg-accent border-accent scale-pop' : 'border-white/25',
        )}
      >
        {done && <Check size={16} className="text-white" strokeWidth={3} />}
      </button>
      <div className="text-lg shrink-0">{habit.emoji || '🔥'}</div>
      <div className="flex-1 text-left min-w-0">
        <div className={clsx('text-[15px] font-medium transition-all truncate', done && 'line-through opacity-60')}>{habit.name}</div>
        <div className="text-[11px] text-hint capitalize">{habit.frequency}</div>
      </div>
      {streak > 0 && (
        <div className={clsx('flex items-center gap-1 rounded-full px-2 py-1 transition-all', st.bg, st.text, st.big ? 'text-[13px] font-bold' : 'text-[12px] font-semibold')}>
          <Flame size={st.big ? 13 : 12} className="flame-bob" />
          <span className="tabular-nums">{streak}</span>
        </div>
      )}
      {showChevron && <ChevronRight size={16} className="text-hint shrink-0" />}
      <Confetti burst={burst} />
    </div>
  );
}
