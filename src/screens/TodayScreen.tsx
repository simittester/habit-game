import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card, Section } from '../components/Card';
import { ProgressRing } from '../components/ProgressRing';
import { CountUp } from '../components/CountUp';
import { CheckInChip } from '../components/CheckInChip';
import { HabitRow } from '../components/HabitRow';
import { TaskRow } from '../components/TaskRow';
import { TimeBlockRow } from '../components/TimeBlockRow';
import { EmptyState } from '../components/EmptyState';
import { AddTaskSheet } from '../components/AddTaskSheet';
import { AddHabitSheet } from '../components/AddHabitSheet';
import { AddTimeBlockSheet } from '../components/AddTimeBlockSheet';
import { AddMealSheet } from '../components/AddMealSheet';
import { AddExpenseSheet } from '../components/AddExpenseSheet';
import { AddSleepSheet } from '../components/AddSleepSheet';
import { GlobalAddButton } from '../components/AddSheet';
import { listHabits, listTodayLogs, toggleHabitToday, isHabitDueToday, listHabitStreaks } from '../api/habits';
import { listTopPriorities, toggleTaskDone } from '../api/tasks';
import { listBlocksForDate, toggleBlock } from '../api/timeblocks';
import { getWaterToday, setWater, fetchScoreFor, listMealsForDate } from '../api/daily';
import { getSleepToday } from '../api/sleep';
import { todayIso, longDate } from '../lib/dates';
import { tg } from '../lib/telegram';
import { useGate } from '../hooks/useGate';
import type { Profile } from '../lib/auth';
import type { Habit, HabitLog, Task, TimeBlock } from '../types/db';

interface Props { profile: Profile }

export default function TodayScreen({ profile }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [taskOpen, setTaskOpen] = useState(false);
  const [habitOpen, setHabitOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const { gate } = useGate();

  const habitsQ = useQuery({ queryKey: ['habits'], queryFn: listHabits });
  const todayLogsQ = useQuery({ queryKey: ['today', 'habit-logs'], queryFn: listTodayLogs });
  const streaksQ = useQuery({ queryKey: ['habit-streaks'], queryFn: listHabitStreaks });
  const priQ = useQuery({ queryKey: ['tasks', 'top'], queryFn: listTopPriorities });
  const blocksQ = useQuery({ queryKey: ['blocks', todayIso()], queryFn: () => listBlocksForDate() });
  const waterQ = useQuery({ queryKey: ['water', 'today'], queryFn: getWaterToday });
  const mealsQ = useQuery({ queryKey: ['meals', 'today'], queryFn: () => listMealsForDate() });
  const sleepQ = useQuery({ queryKey: ['sleep', 'today'], queryFn: getSleepToday });
  const scoreQ = useQuery({ queryKey: ['score', todayIso()], queryFn: () => fetchScoreFor(todayIso()) });

  const todayHabits: Habit[] = (habitsQ.data ?? []).filter((h: Habit) => isHabitDueToday(h));
  const habitLogMap = new Map((todayLogsQ.data ?? []).map((l: HabitLog) => [l.habit_id, l]));
  const habitsDone = todayHabits.filter((h: Habit) => habitLogMap.has(h.id)).length;

  const tasks = priQ.data ?? [];
  const tasksDone = tasks.filter((t: Task) => t.status === 'done').length;

  const total = todayHabits.length + tasks.length;
  const done = habitsDone + tasksDone;
  const pct = total === 0 ? 0 : done / total;

  const greet = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const toggleHabit = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => toggleHabitToday(id, done),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today'] });
      qc.invalidateQueries({ queryKey: ['habit-streaks'] });
      qc.invalidateQueries({ queryKey: ['score'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const toggleTask = useMutation({
    mutationFn: (t: Task) => toggleTaskDone(t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['score'] });
    },
  });

  const toggleBlk = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => toggleBlock(id, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] });
      qc.invalidateQueries({ queryKey: ['score'] });
    },
  });

  const waterPlus = useMutation({
    mutationFn: async () => setWater((waterQ.data?.glasses ?? 0) + 1, waterQ.data?.target ?? 8),
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries({ queryKey: ['water'] }); qc.invalidateQueries({ queryKey: ['score'] }); },
  });

  const waterGlasses = waterQ.data?.glasses ?? 0;
  const waterTarget = waterQ.data?.target ?? 8;
  const waterDone = waterGlasses >= waterTarget;
  const mealsCount = (mealsQ.data ?? []).length;

  return (
    <div className="space-y-2 pt-2 pb-6">
      <Section title={longDate(new Date())}>
        <div className="-mt-1 mb-3">
          <h1 className="text-[28px] leading-tight font-bold">{greet}, {profile.first_name || 'friend'}.</h1>
          <div className="text-[14px] text-hint">Keep the momentum going.</div>
        </div>

        <Card>
          <div className="flex items-center gap-4">
            <div className="relative" style={{ width: 64, height: 64 }}>
              <ProgressRing value={pct} size={64} stroke={6} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <CountUp
                  value={pct * 100}
                  className="text-[13px] font-semibold tabular-nums"
                  format={(v) => `${Math.round(v)}%`}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-semibold">
                <CountUp value={pct * 100} format={(v) => `${Math.round(v)}%`} /> complete
              </div>
              <div className="text-[13px] text-hint">{tasksDone} of {tasks.length} tasks · {habitsDone} of {todayHabits.length} habits</div>
            </div>
            {(scoreQ.data ?? 0) > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-accent tabular-nums">
                  <CountUp value={scoreQ.data ?? 0} />
                </div>
                <div className="text-[10px] text-hint tracking-wider">SCORE</div>
              </div>
            )}
          </div>
        </Card>
      </Section>

      <Section title="Daily check-in" action={<button onClick={() => navigate('/more/health')} className="text-accent text-[13px]">Open all</button>}>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          <CheckInChip
            emoji="💧"
            title={waterDone ? 'Water' : 'Water +1'}
            hint={`${waterGlasses}/${waterTarget} glasses`}
            onClick={gate(() => waterPlus.mutate())}
            done={waterDone}
          />
          <CheckInChip
            emoji="🍽️"
            title="Meal"
            hint={mealsCount === 0 ? 'Log a meal' : `${mealsCount} logged`}
            onClick={gate(() => setMealOpen(true))}
            done={mealsCount >= 3}
          />
          <CheckInChip
            emoji="💸"
            title="Expense"
            hint="Quick spend"
            onClick={gate(() => setExpenseOpen(true))}
          />
          <CheckInChip
            emoji="😴"
            title="Sleep"
            hint={sleepQ.data ? `${Number(sleepQ.data.hours).toFixed(1)}h logged` : 'Log sleep'}
            onClick={gate(() => setSleepOpen(true))}
            done={Boolean(sleepQ.data && Number(sleepQ.data.hours) >= 7)}
          />
        </div>
      </Section>

      {tasks.length === 0 && (
        <Section title="">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-[14px]">Step 1. Add one task that actually matters today.</div>
              <button onClick={gate(() => setTaskOpen(true))} className="px-4 py-2 rounded-full bg-accent text-white text-[13px] font-semibold">Add task</button>
            </div>
          </Card>
        </Section>
      )}

      <Section title="Top priorities" action={<button onClick={gate(() => setTaskOpen(true))} className="text-accent text-[13px]"><Plus size={14} className="inline -mt-0.5" /> Add</button>}>
        {tasks.length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No priorities yet.</div></Card>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {tasks.map((t: Task) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleTask.mutate(t)} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Your day" action={<button onClick={gate(() => setBlockOpen(true))} className="text-accent text-[13px]"><Plus size={14} className="inline -mt-0.5" /> Add</button>}>
        {(blocksQ.data ?? []).length === 0 ? (
          <button
            onClick={gate(() => setBlockOpen(true))}
            className="w-full py-6 rounded-2xl border-2 border-dashed border-divider text-hint text-[13px] hover:border-accent hover:text-accent transition"
          >
            + Add time block
          </button>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {(blocksQ.data ?? []).map((b: TimeBlock) => (
              <TimeBlockRow key={b.id} block={b} onToggle={() => toggleBlk.mutate({ id: b.id, completed: !b.completed })} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Habits today" action={<button onClick={gate(() => setHabitOpen(true))} className="text-accent text-[13px]"><Plus size={14} className="inline -mt-0.5" /> Add</button>}>
        {todayHabits.length === 0 ? (
          <EmptyState emoji="🔥" title="No habits for today" hint="Tap + to build one." />
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {todayHabits.map((h: Habit) => (
              <HabitRow
                key={h.id}
                habit={h}
                done={habitLogMap.has(h.id)}
                streak={streaksQ.data?.get(h.id) ?? 0}
                onToggle={() => toggleHabit.mutate({ id: h.id, done: habitLogMap.has(h.id) })}
              />
            ))}
          </div>
        )}
      </Section>

      <AddTaskSheet open={taskOpen} onClose={() => setTaskOpen(false)} />
      <AddHabitSheet open={habitOpen} onClose={() => setHabitOpen(false)} />
      <AddTimeBlockSheet open={blockOpen} onClose={() => setBlockOpen(false)} />
      <AddMealSheet open={mealOpen} onClose={() => setMealOpen(false)} />
      <AddExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <AddSleepSheet open={sleepOpen} onClose={() => setSleepOpen(false)} />
      <GlobalAddButton />
    </div>
  );
}
