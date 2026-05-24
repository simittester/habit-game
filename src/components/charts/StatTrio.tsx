import clsx from 'clsx';

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
  color?: 'accent' | 'success' | 'warn' | 'danger' | 'default';
}

const COLOR_MAP = {
  accent: 'text-accent',
  success: 'text-green-400',
  warn: 'text-amber-300',
  danger: 'text-red-400',
  default: 'text-text',
};

export function StatTrio({ items }: { items: StatItem[] }) {
  return (
    <div className={`grid gap-2 ${items.length === 4 ? 'grid-cols-2' : `grid-cols-${items.length}`}`}>
      {items.map((it, i) => (
        <div key={i} className="bg-bg-3 rounded-2xl px-3 py-3 text-center">
          <div className={clsx('text-[22px] font-bold leading-tight tabular-nums', COLOR_MAP[it.color ?? 'default'])}>
            {it.value}
          </div>
          <div className="text-[11px] text-hint mt-0.5 capitalize">{it.label}</div>
          {it.hint && <div className="text-[10px] text-hint mt-0.5">{it.hint}</div>}
        </div>
      ))}
    </div>
  );
}
