import { useEffect, useState } from 'react';
import { Check, Star } from 'lucide-react';
import clsx from 'clsx';
import { tg } from '../lib/telegram';
import { useGate } from '../hooks/useGate';
import type { Task } from '../types/db';

interface Props {
  task: Task;
  onToggle: () => void;
  onClick?: () => void;
}

export function TaskRow({ task, onToggle, onClick }: Props) {
  const done = task.status === 'done';
  const [popKey, setPopKey] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const { gate } = useGate();

  useEffect(() => {
    if (!done) {
      setJustCompleted(false);
      return;
    }
  }, [done]);

  const handleToggle = gate(() => {
    tg.haptic(done ? 'light' : 'medium');
    setPopKey((k) => k + 1);
    if (!done) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggle();
  });

  return (
    <div className={clsx(
      'w-full flex items-center gap-3 px-3 py-3 bg-bg-2 first:rounded-t-2xl last:rounded-b-2xl border-b border-divider last:border-b-0 transition-all',
      justCompleted && 'bg-green-500/5',
    )}>
      <button
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        aria-label="Toggle task"
        key={popKey}
        className={clsx(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition',
          done ? 'bg-green-500 border-green-500 scale-pop' : 'border-white/25',
        )}
      >
        {done && <Check size={16} className="text-white" strokeWidth={3} />}
      </button>
      <button onClick={onClick} className="flex-1 text-left active:opacity-70">
        <div className={clsx('text-[15px] font-medium transition-all', done && 'line-through opacity-60')}>{task.title}</div>
        {task.notes && <div className="text-[12px] text-hint line-clamp-1">{task.notes}</div>}
      </button>
      {task.priority >= 1 && (
        <Star size={16} className={clsx(task.priority >= 2 ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400')} />
      )}
    </div>
  );
}
