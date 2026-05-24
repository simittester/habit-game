import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Section, Card } from '../components/Card';
import { ScoreGauge } from '../components/ProgressRing';
import { CalendarMonth } from '../components/CalendarMonth';
import { GlobalAddButton } from '../components/AddSheet';
import { fetchSummary, fetchScoreFor } from '../api/daily';
import { todayIso } from '../lib/dates';
import { format, isSameMonth, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { tg } from '../lib/telegram';
import type { DailySummary } from '../types/db';

import { TasksPanel } from '../components/progress/TasksPanel';
import { HabitsPanel } from '../components/progress/HabitsPanel';
import { HealthPanel } from '../components/progress/HealthPanel';
import { MoneyPanel } from '../components/progress/MoneyPanel';
import { DailyPlansPanel } from '../components/progress/DailyPlansPanel';
import { ProjectsAreasPanel } from '../components/progress/ProjectsAreasPanel';
import { CapturesPanel } from '../components/progress/CapturesPanel';
import { ReviewsPanel } from '../components/progress/ReviewsPanel';
import { ActivityPanel } from '../components/progress/ActivityPanel';

type Range = 7 | 14 | 'month';

export default function ProgressScreen() {
  const [range, setRange] = useState<Range>(7);
  const [calMonth, setCalMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const navigate = useNavigate();

  // Always pull 60 days so calendar has data
  const summaryQ = useQuery({ queryKey: ['summary', 60], queryFn: () => fetchSummary(60) });
  const scoreQ = useQuery({ queryKey: ['score', todayIso()], queryFn: () => fetchScoreFor(todayIso()) });

  const allRows = (summaryQ.data ?? []) as DailySummary[];

  // Compute the actual date range based on the selected mode
  const { rows, startDate, endDate, rangeDays, rangeLabel } = useMemo(() => {
    if (range === 'month') {
      const start = startOfMonth(calMonth);
      const end = endOfMonth(calMonth);
      const startIso = format(start, 'yyyy-MM-dd');
      const endIso = format(end, 'yyyy-MM-dd');
      const filteredRows = allRows.filter((r) => r.day >= startIso && r.day <= endIso);
      const today = new Date();
      const actualEnd = end > today ? today : end;
      return {
        rows: filteredRows,
        startDate: start,
        endDate: actualEnd,
        rangeDays: end.getDate(),
        rangeLabel: format(calMonth, 'MMMM yyyy'),
      };
    }
    const days = range as number;
    const end = new Date();
    const start = subDays(end, days - 1);
    const startIso = format(start, 'yyyy-MM-dd');
    const filteredRows = allRows.filter((r) => r.day >= startIso);
    return {
      rows: filteredRows,
      startDate: start,
      endDate: end,
      rangeDays: days,
      rangeLabel: `Last ${days} days`,
    };
  }, [range, calMonth, allRows]);

  const totals = rows.reduce(
    (acc, r) => ({
      tasksDone: acc.tasksDone + r.tasks_done,
      tasksTotal: acc.tasksTotal + r.tasks_total,
      habitsDone: acc.habitsDone + r.habits_done,
      habitsPlanned: acc.habitsPlanned + r.habits_planned,
      expenses: acc.expenses + Number(r.expenses_total),
      activeDays: acc.activeDays + (r.tasks_done + r.habits_done + r.blocks_done > 0 ? 1 : 0),
    }),
    { tasksDone: 0, tasksTotal: 0, habitsDone: 0, habitsPlanned: 0, expenses: 0, activeDays: 0 },
  );

  const habitRate = totals.habitsPlanned === 0 ? 0 : Math.round((totals.habitsDone / totals.habitsPlanned) * 100);
  const taskRate = totals.tasksTotal === 0 ? 0 : Math.round((totals.tasksDone / totals.tasksTotal) * 100);

  const bestDay = rows.reduce<DailySummary | null>((best, r) => {
    const r_score = r.tasks_done + r.habits_done + r.blocks_done;
    if (!best) return r;
    const b_score = best.tasks_done + best.habits_done + best.blocks_done;
    return r_score > b_score ? r : best;
  }, null);

  const score = scoreQ.data ?? 0;
  const scoreStatus = score >= 70 ? 'Strong' : score >= 40 ? 'Steady' : 'Needs reset';

  const selectedDayStats = selectedDay
    ? allRows.find((r) => r.day === format(selectedDay, 'yyyy-MM-dd'))
    : null;

  const showCalendar = range === 'month';

  return (
    <div className="pb-6">
      <Section title="Progress">
        <h1 className="text-[28px] font-bold leading-tight">Your life at a glance</h1>
        <div className="text-[14px] text-hint">{rangeLabel}</div>
      </Section>

      <div className="px-4 mb-4">
        <div className="flex bg-bg-2 rounded-full p-1 gap-1">
          {([7, 14, 'month'] as Range[]).map((r) => (
            <button
              key={String(r)}
              onClick={() => { tg.selection(); setRange(r); setSelectedDay(null); }}
              className={`flex-1 py-2 rounded-full text-[13px] font-medium transition ${
                range === r ? 'bg-bg-4 text-text' : 'text-hint'
              }`}
            >
              {r === 'month' ? 'Month' : `${r}D`}
            </button>
          ))}
        </div>
      </div>

      <Section title="Quick actions">
        <Card>
          <div className="text-[12px] text-hint tracking-wider uppercase mb-1">Today</div>
          <div className="text-[14px] mb-3 -mt-1">Turn missing logs into one or two taps.</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/today')} className="py-2 rounded-2xl bg-bg-3 text-[13px] active:opacity-70">Log today</button>
            <button onClick={() => navigate('/more/health')} className="py-2 rounded-2xl bg-bg-3 text-[13px] active:opacity-70">Add meal</button>
            <button onClick={() => navigate('/more/money')} className="py-2 rounded-2xl bg-bg-3 text-[13px] active:opacity-70">Add expense</button>
            <button onClick={() => navigate('/today')} className="py-2 rounded-2xl bg-accent text-white text-[13px] font-semibold">Open Today</button>
          </div>
        </Card>
      </Section>

      {showCalendar && (
        <Section title="">
          <Card>
            <CalendarMonth
              summaries={allRows}
              month={calMonth}
              onMonthChange={(d) => { setCalMonth(d); setSelectedDay(null); }}
              onDayTap={(d) => setSelectedDay(d)}
              selectedDay={selectedDay}
            />

            {selectedDay && selectedDayStats && (
              <div className="mt-4 pt-4 border-t border-divider">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[14px] font-semibold">{format(selectedDay, 'EEE, MMM d')}</div>
                  <button onClick={() => setSelectedDay(null)} className="text-accent text-[12px] active:opacity-60">Close</button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <DayStat label="Habits" value={`${selectedDayStats.habits_done}/${selectedDayStats.habits_planned}`} />
                  <DayStat label="Tasks" value={`${selectedDayStats.tasks_done}/${selectedDayStats.tasks_total}`} />
                  <DayStat label="Water" value={`${selectedDayStats.water_glasses}/${selectedDayStats.water_target}`} />
                </div>
              </div>
            )}
            {selectedDay && !selectedDayStats && (
              <div className="mt-4 pt-4 border-t border-divider text-center">
                <div className="text-[14px] font-semibold mb-1">{format(selectedDay, 'EEE, MMM d')}</div>
                <div className="text-[12px] text-hint">{isSameMonth(selectedDay, new Date()) ? 'No activity logged that day.' : 'Older than 60 days — data not stored.'}</div>
              </div>
            )}
          </Card>
        </Section>
      )}

      <Section title="">
        <Card>
          <div className="flex items-center gap-3">
            <ScoreGauge score={score} />
            <div className="flex-1">
              <div className="text-[11px] tracking-wider text-hint uppercase">{rangeLabel}</div>
              <div className="text-[18px] font-bold">{scoreStatus}</div>
              <div className="text-[13px] text-hint mt-1">
                {score >= 70 ? 'Strong week so far. Keep the streak honest.' : score >= 40 ? 'Steady. A weekly review will lock the rhythm.' : 'Reset with one habit and one task.'}
              </div>
              <div className="grid grid-cols-2 mt-2 gap-2 text-[12px]">
                <div><div className="text-hint">Active days</div><div className="text-text font-semibold tabular-nums">{totals.activeDays} / {rangeDays}</div></div>
                {bestDay && (
                  <div><div className="text-hint">Best day</div><div className="text-green-400 font-semibold">{format(new Date(bestDay.day), 'EEE, MMM d')}</div></div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="">
        <div className="grid grid-cols-2 gap-3">
          <StatCard emoji="✅" label="TASKS DONE" value={String(totals.tasksDone)} hint={`${taskRate}% rate`} />
          <StatCard emoji="🔥" label="HABIT RATE" value={`${habitRate}%`} hint={`${totals.habitsDone} logged`} />
          <StatCard emoji="💰" label="SPENT" value={`-$${totals.expenses.toFixed(0)}`} hint={`${totals.expenses > 0 ? `${rows.length} days` : 'nothing logged'}`} color={totals.expenses > 0 ? 'text-red-400' : 'text-green-400'} />
          <StatCard emoji="📅" label="DAYS ACTIVE" value={String(totals.activeDays)} hint={`of ${rangeDays} days`} />
        </div>
      </Section>

      <Section title="Breakdowns">
        <TasksPanel rows={rows} startDate={startDate} endDate={endDate} />
        <HabitsPanel rows={rows} startDate={startDate} endDate={endDate} />
        <HealthPanel rows={rows} startDate={startDate} endDate={endDate} />
        <MoneyPanel startDate={startDate} endDate={endDate} />
        <DailyPlansPanel rows={rows} startDate={startDate} />
        <ProjectsAreasPanel />
        <CapturesPanel startDate={startDate} endDate={endDate} />
        <ReviewsPanel startDate={startDate} />
        <ActivityPanel rows={rows} startDate={startDate} endDate={endDate} />
      </Section>

      <GlobalAddButton />
    </div>
  );
}

function DayStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-3 rounded-xl py-2">
      <div className="text-[10px] tracking-wider text-hint uppercase">{label}</div>
      <div className="text-[14px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function StatCard({ emoji, label, value, hint, color }: { emoji: string; label: string; value: string; hint: string; color?: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-lg">{emoji}</div>
        <div className="text-[10px] tracking-wider text-hint">{label}</div>
      </div>
      <div className={`text-2xl font-bold ${color ?? ''}`}>{value}</div>
      <div className="text-[12px] text-hint mt-0.5">{hint}</div>
    </Card>
  );
}
