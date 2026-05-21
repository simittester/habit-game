import clsx from 'clsx';
import { format, subDays, startOfDay, getDay } from 'date-fns';
import type { Habit, HabitLog } from '../types/db';
import { isHabitDueToday } from '../api/habits';

interface Props {
  habit: Habit;
  logs: HabitLog[];
  weeks?: number; // how many columns of weeks to show
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Mon-Sun rows

export function HabitHeatmap({ habit, logs, weeks = 14 }: Props) {
  // Build a Set of ISO dates with a log
  const logged = new Set(logs.map((l) => l.log_date));

  const todayD = startOfDay(new Date());
  // Find the most recent Sunday (or today if Sunday). Actually we want the rightmost column to end on today
  // Rightmost column: today + earlier days of this iso-week
  // Rows correspond to Mon..Sun (isoWeekday 1..7)
  const totalDays = weeks * 7;
  const start = subDays(todayD, totalDays - 1);
  // Build per-cell info as a 2D grid: cols × rows (7 rows: Mon..Sun)
  const cols: Array<Array<{
    date: Date;
    isFuture: boolean;
    isToday: boolean;
    logged: boolean;
    due: boolean;
    inRange: boolean;
  } | null>> = [];

  // Align so leftmost column starts on a Monday containing `start`
  const startWeekday = (getDay(start) + 6) % 7; // 0=Mon, 6=Sun
  const alignedStart = subDays(start, startWeekday);

  // We need enough columns to cover from alignedStart to today inclusive
  const daysFromAligned = Math.ceil((todayD.getTime() - alignedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const colCount = Math.ceil(daysFromAligned / 7);

  for (let c = 0; c < colCount; c++) {
    const col: typeof cols[number] = [];
    for (let r = 0; r < 7; r++) {
      const day = startOfDay(new Date(alignedStart.getTime() + (c * 7 + r) * 86400000));
      const inRange = day.getTime() >= start.getTime() && day.getTime() <= todayD.getTime();
      const dayIso = format(day, 'yyyy-MM-dd');
      const isFuture = day.getTime() > todayD.getTime();
      const isToday = day.getTime() === todayD.getTime();
      const isDue = isHabitDueToday(habit, day);
      col.push({
        date: day,
        isFuture,
        isToday,
        logged: logged.has(dayIso),
        due: isDue,
        inRange,
      });
    }
    cols.push(col);
  }

  return (
    <div className="flex gap-1 overflow-x-auto">
      {/* Day label column */}
      <div className="flex flex-col gap-1 mr-1 shrink-0">
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="w-3 h-3 text-[8px] text-hint flex items-center justify-center"
          >
            {i % 2 === 0 ? d : ''}
          </div>
        ))}
      </div>
      {cols.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1 shrink-0">
          {col.map((cell, ri) => {
            if (!cell) return <div key={ri} className="w-3 h-3" />;
            if (cell.isFuture || !cell.inRange) {
              return <div key={ri} className="w-3 h-3 rounded-[3px] bg-bg-3 opacity-30" title={format(cell.date, 'MMM d')} />;
            }
            return (
              <div
                key={ri}
                title={`${format(cell.date, 'MMM d')}${cell.logged ? ' · done' : cell.due ? ' · missed' : ' · not due'}`}
                className={clsx(
                  'w-3 h-3 rounded-[3px] transition',
                  cell.logged
                    ? 'bg-green-500/80'
                    : cell.due
                      ? 'bg-bg-4'
                      : 'bg-bg-3 opacity-50',
                  cell.isToday && !cell.logged && 'ring-1 ring-accent',
                  cell.isToday && cell.logged && 'ring-2 ring-green-300',
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
