import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { StatTrio } from '../charts/StatTrio';
import { MiniLineChart } from '../charts/MiniLineChart';
import { ActivityGrid } from '../charts/ActivityGrid';
import { ProgressRow } from '../charts/ProgressRow';
import { InsightCard } from '../charts/InsightCard';
import { listHabits, listAllHabitLogsInRange, listHabitStreaks, isHabitDueToday } from '../../api/habits';
import { format, eachDayOfInterval } from 'date-fns';
import type { DailySummary, Habit, HabitLog } from '../../types/db';

interface Props {
  rows: DailySummary[];
  startDate: Date;
  endDate: Date;
}

export function HabitsPanel({ rows, startDate, endDate }: Props) {
  const startIso = format(startDate, 'yyyy-MM-dd');
  const endIso = format(endDate, 'yyyy-MM-dd');

  const habitsQ = useQuery({ queryKey: ['habits'], queryFn: listHabits });
  const logsQ = useQuery({
    queryKey: ['progress', 'habit-logs', startIso, endIso],
    queryFn: () => listAllHabitLogsInRange(startIso, endIso),
  });
  const streaksQ = useQuery({ queryKey: ['habit-streaks'], queryFn: listHabitStreaks });

  const habits = (habitsQ.data ?? []) as Habit[];
  const logs = (logsQ.data ?? []) as HabitLog[];
  const streaks = streaksQ.data ?? new Map<string, number>();

  // Totals from the summary (more accurate than counting logs)
  const totals = rows.reduce((acc, r) => ({
    done: acc.done + r.habits_done,
    planned: acc.planned + r.habits_planned,
  }), { done: 0, planned: 0 });

  const rate = totals.planned === 0 ? 0 : Math.round((totals.done / totals.planned) * 100);
  const logged = logs.length;

  // Daily rate line: per-day completion percentage
  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);
  const dailyRates = rows.map((r) => r.habits_planned === 0 ? 0 : Math.round((r.habits_done / r.habits_planned) * 100));

  // Per-habit completion in range (done / due)
  const perHabit = habits.map((h) => {
    const dueDays = days.filter((d) => isHabitDueToday(h, d)).length;
    const doneDays = logs.filter((l) => l.habit_id === h.id).length;
    const rate = dueDays === 0 ? 0 : Math.round((doneDays / dueDays) * 100);
    return { habit: h, doneDays, dueDays, rate };
  }).sort((a, b) => b.rate - a.rate);

  const best = perHabit.find((p) => p.rate > 0);
  const worst = [...perHabit].reverse().find((p) => p.dueDays > 0);

  // Activity grid for last 14 days (limit rows so it doesn't get huge)
  const gridDays = 14;
  const gridStart = new Date();
  gridStart.setDate(gridStart.getDate() - (gridDays - 1));
  const gridDates = eachDayOfInterval({ start: gridStart, end: new Date() });
  const gridRows = habits.slice(0, 5).map((h) => ({
    label: `${h.emoji ?? '🔥'} ${h.name}`,
    days: gridDates.map((d) => {
      const iso = format(d, 'yyyy-MM-dd');
      return logs.some((l) => l.habit_id === h.id && l.log_date === iso) ? 1 : 0;
    }),
  }));

  const noData = habits.length === 0;

  return (
    <Panel
      emoji="🔥"
      title="Habits"
      summary={rate > 0 ? <SummaryPill value={`${rate}%`} color={rate >= 70 ? 'success' : rate >= 40 ? 'warn' : 'danger'} /> : undefined}
    >
      {noData ? (
        <div className="text-hint text-[13px] text-center py-3">No habits added yet.</div>
      ) : (
        <>
          <StatTrio items={[
            { label: 'Rate', value: `${rate}%`, color: rate >= 70 ? 'success' : 'accent' },
            { label: 'Logged', value: logged, color: 'accent' },
            { label: 'Habits', value: habits.length, color: 'default' },
          ]} />

          {dailyRates.some((r) => r > 0) && (
            <PanelSection title="Daily rate">
              <MiniLineChart values={dailyRates} height={48} color="var(--color-accent)" showZero target={100} />
            </PanelSection>
          )}

          {best && worst && best.habit.id !== worst.habit.id && (
            <PanelSection>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-bg-3 rounded-2xl p-3">
                  <div className="text-[10px] text-green-400 tracking-wider uppercase font-semibold">Best</div>
                  <div className="text-[14px] font-semibold mt-0.5 truncate">{best.habit.emoji} {best.habit.name}</div>
                  <div className="text-[11px] text-hint tabular-nums">{best.rate}%</div>
                </div>
                <div className="bg-bg-3 rounded-2xl p-3">
                  <div className="text-[10px] text-amber-300 tracking-wider uppercase font-semibold">Needs work</div>
                  <div className="text-[14px] font-semibold mt-0.5 truncate">{worst.habit.emoji} {worst.habit.name}</div>
                  <div className="text-[11px] text-hint tabular-nums">{worst.rate}%</div>
                </div>
              </div>
            </PanelSection>
          )}

          <PanelSection title="Current streaks">
            {habits.map((h) => {
              const s = streaks.get(h.id) ?? 0;
              const maxStreakReference = Math.max(7, ...Array.from(streaks.values()));
              return (
                <ProgressRow
                  key={h.id}
                  label={h.name}
                  emoji={h.emoji}
                  value={Math.min(1, s / maxStreakReference)}
                  rightText={`${s}d`}
                  color={s >= 7 ? 'success' : 'accent'}
                />
              );
            })}
          </PanelSection>

          {gridRows.length > 0 && (
            <PanelSection title="Activity grid (last 14 days)">
              <ActivityGrid rows={gridRows} days={gridDays} />
            </PanelSection>
          )}

          {best && best.rate >= 80 && (
            <InsightCard><strong>{best.habit.name}</strong> is your most consistent habit at <strong>{best.rate}%</strong>. Anchor new habits to it.</InsightCard>
          )}
          {worst && worst.rate < 30 && worst.dueDays >= 7 && (
            <InsightCard><strong>{worst.habit.name}</strong> is below 30%. Either shrink it (make it tiny) or archive and replace.</InsightCard>
          )}
        </>
      )}
    </Panel>
  );
}
