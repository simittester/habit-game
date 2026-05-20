import { Check } from 'lucide-react';
import clsx from 'clsx';
import { tg } from '../lib/telegram';
import type { TimeBlock } from '../types/db';

interface Props {
  block: TimeBlock;
  onToggle: () => void;
}

export function TimeBlockRow({ block, onToggle }: Props) {
  const hhmm = block.start_time?.slice(0, 5);
  return (
    <button
      onClick={() => { tg.haptic('light'); onToggle(); }}
      className="w-full flex items-center gap-3 px-3 py-3 bg-bg-2 first:rounded-t-2xl last:rounded-b-2xl active:opacity-70 transition border-b border-divider last:border-b-0"
    >
      <div
        className={clsx(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition',
          block.completed ? 'bg-accent border-accent' : 'border-white/25',
        )}
      >
        {block.completed && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
      <div className="text-[13px] text-hint w-12 tabular-nums">{hhmm}</div>
      <div className={clsx('flex-1 text-left text-[15px] font-medium', block.completed && 'line-through opacity-60')}>{block.title}</div>
      <div className="text-[12px] text-hint">{block.duration_minutes}m</div>
    </button>
  );
}
