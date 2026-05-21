import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Section, Card } from '../components/Card';
import { ScoreGauge } from '../components/ProgressRing';
import { CalendarMonth } from '../components/CalendarMonth';
import { GlobalAddButton } from '../components/AddSheet';
import { fetchSummary, fetchScoreFor } from '../api/daily';
import { todayIso } from '../lib/dates';
import { format, isSameMonth, startOfMonth } from 'date-fns';
import { tg } from '../lib/telegram';
import type { DailySummary } from '../types/db';

type Range = 7 | 14 | 30 | 60;

export default function ProgressScreen() {
  const [range, setRange] = useState<Range>(7);
  const [calMonth, setCalMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const navigate = useNavigate();

  // Always pull 60 days so calendar has data
  const summaryQ = useQuery({ queryKey: ['summary', 60], queryFn: () => fetchSummary(60) });
  const scoreQ = useQuery({ queryKey: ['score', todayIso()], queryFn: () => fetchScoreFor(todayIso()) });

  const allRows = (summaryQ.data ?? []) as DailySummary[];
  // Slice to the selected range for stat aggregation
  const rows = allRows.slice(Math.max(0, allRows.length - range));

  const totals = rows.reduce(
    (acc, r) => ({
      tasksDone: acc.tasksDone + r.tasks_done,
      tasksTotal: acc.tasksTotal + r.tasks_total,
      habitsDone: acc.habitsDone + r.habits_done,
      habitsPlanned: acc.habitsPlanned + r.habits_planned,
      water: acc.water + r.water_glasses,
      meals: acc.meals + r.meals_logged,
      expenses: acc.expenses + Number(r.expenses_total),
      blocksDone: acc.blocksDone + r.blocks_done,
      activeDays: acc.activeDays + (r.tasks_done + r.habits_done + r.blocks_done > 0 ? 1 : 0),
    }),
    { tasksDone: 0, tasksTotal: 0, habitsDone: 0, habitsPlanned: 0, water: 0, meals: 0, expenses: 0, blocksDone: 0, activeDays: 0 },
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

  // Stats for the selected day in Month view
  const selectedDayStats = selectedDay
    ? allRows.find((r) => r.day === format(selectedDay, 'yyyy-MM-dd'))
    : null;

  const showCalendar = range === 60;

  return (
    <div className="pb-6">
      <Section title="Progress">
        <h1 className="text-[28px] font-bold leading-tight">Your life at a glance</h1>
        <div className="text-[14px] text-hint">{range === 60 ? format(calMonth, 'MMMM yyyy') : `Last ${range} days`}</div>
      </Section>

      <div className="px-4 mb-4">
        <div className="flex bg-bg-2 rounded-full p-1 gap-1">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => { tg.selection(); setRange(d as Range); setSelectedDay(null); }}
              className={`flex-1 py-2 rounded-full text-[13px] font-medium transition ${
                range === d ? 'bg-bg-4 text-text' : 'text-hint'
              }`}
            >
              {d === 60 ? 'Month' : `${d}D`}
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
              <div className="text-[11px] tracking-wider text-hint uppercase">Last {range === 60 ? 'month' : `${range} days`}</div>
              <div className="text-[18px] font-bold">{scoreStatus}</div>
              <div className="text-[13px] text-hint mt-1">
                Weekly review {score >= 50 ? 'looking good' : 'is missing. Add it to make progress visible.'}
              </div>
              <div className="grid grid-cols-2 mt-2 gap-2 text-[12px]">
                <div><div className="text-hint">Active days</div><div className="text-text font-semibold">{totals.activeDays} / {range}</div></div>
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
          <StatCard emoji="💰" label="BALANCE" value={`-$${totals.expenses.toFixed(0)}`} hint={`$${totals.expenses.toFixed(0)} spent`} color={totals.expenses > 0 ? 'text-red-400' : 'text-green-400'} />
          <StatCard emoji="📅" label="DAYS PLANNED" value={String(totals.activeDays)} hint={`of ${range} days`} />
        </div>
      </Section>

      <Section title="">
        <CollapseSection emoji="✅" title="Tasks" empty={totals.tasksTotal === 0 ? 'No tasks tracked yet. Plan one task today to start seeing progress here.' : `${totals.tasksDone} / ${totals.tasksTotal} completed.`} />
        <CollapseSection emoji="🔥" title="Habits" empty={totals.habitsPlanned === 0 ? 'No habits added yet. Add one tiny habit to start building consistency.' : `${totals.habitsDone} / ${totals.habitsPlanned} habits logged.`} />
        <CollapseSection emoji="❤️" title="Health" empty={`${totals.water} glasses · ${totals.meals} meals logged.`} />
        <CollapseSection emoji="💵" title="Money" empty={`$${totals.expenses.toFixed(2)} spent in last ${range} days.`} />
        <CollapseSection emoji="📋" title="Daily Plans" empty={`${totals.blocksDone} blocks completed.`} />
        <CollapseSection emoji="📁" title="Projects & Areas" empty="Tap More → Projects to set up." />
        <CollapseSection emoji="💡" title="Captures" empty="Inbox lives in the Inbox tab." />
        <CollapseSection emoji="📊" title="Reviews" empty="No reviews yet." />
        <CollapseSection emoji="⚡" title="Activity" empty="See More → Activity for the full feed." />
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

function CollapseSection({ emoji, title, empty }: { emoji: string; title: string; empty: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-bg-2 rounded-2xl mb-2">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center px-4 py-3 text-left">
        <div className="text-lg mr-2">{emoji}</div>
        <div className="flex-1 font-semibold">{title}</div>
        <div className="text-hint">{open ? '▴' : '▾'}</div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[14px] text-hint">{empty}</div>
      )}
    </div>
  );
}
