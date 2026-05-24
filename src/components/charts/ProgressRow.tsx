import clsx from 'clsx';

interface Props {
  label: string;
  emoji?: string;
  /** 0..1 */
  value: number;
  rightText?: string;
  color?: 'accent' | 'success' | 'warn' | 'danger';
}

const COLORS = {
  accent: 'bg-accent',
  success: 'bg-green-500',
  warn: 'bg-amber-400',
  danger: 'bg-red-400',
};

export function ProgressRow({ label, emoji, value, rightText, color = 'accent' }: Props) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1 text-[13px]">
        <div className="flex items-center gap-1.5 min-w-0">
          {emoji && <span>{emoji}</span>}
          <span className="truncate">{label}</span>
        </div>
        {rightText && <span className="text-hint shrink-0 tabular-nums text-[12px]">{rightText}</span>}
      </div>
      <div className="h-1.5 bg-bg-4 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', COLORS[color])}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
