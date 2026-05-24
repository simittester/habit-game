import clsx from 'clsx';

interface Props {
  /** Each row = one habit. Each cell = 1 if logged that day, 0 otherwise. */
  rows: Array<{ label: string; days: number[] }>;
  days?: number;
}

// Compact GitHub-style activity grid for habits.
export function ActivityGrid({ rows, days = 14 }: Props) {
  if (rows.length === 0) return <div className="text-[11px] text-hint">No habits yet.</div>;
  return (
    <div className="space-y-1">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="text-[10px] text-hint truncate w-[80px] shrink-0">{row.label}</div>
          <div className="flex gap-[2px] flex-1">
            {row.days.slice(-days).map((d, j) => (
              <div
                key={j}
                className={clsx(
                  'h-3 flex-1 rounded-[2px] transition',
                  d > 0 ? 'bg-accent/80' : 'bg-bg-3',
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
