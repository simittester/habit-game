import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card, Section } from '../components/Card';
import { ProgressRing } from '../components/ProgressRing';
import { CheckInChip } from '../components/CheckInChip';
import { HabitRow } from '../components/HabitRow';
import { TaskRow } from '../components/TaskRow';
import { TimeBlockRow } from '../components/TimeBlockRow';
import { EmptyState } from '../components/EmptyState';
import { AddTaskSheet } from '../components/AddTaskSheet';
import { AddHabitSheet } from '../components/AddHabitSheet';
import { AddTimeBlockSheet } from '../components/AddTimeBlockSheet';
import { GlobalAddButton } from '../components/AddSheet';
import { listHabits, listTodayLogs, toggleHabitToday, isHabitDueToday } from '../api/habits';
import { listTopPriorities, toggleTaskDone } from '../api/tasks';
import { listBlocksForDate, toggleBlock } from '../api/timeblocks';
import { getWaterToday, setWater, addExpense, addMeal, fetchScoreFor } from '../api/daily';
import { todayIso, longDate } from '../lib/dates';
import { tg } from '../lib/telegram';
import type { Profile } from '../lib/auth';
import type { Habit, HabitLog, Task, TimeBlock } from '../types/db';

interface Props { profile: Profile }

export default function TodayScreen({ profile }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [taskOpen, setTaskOpen] = useState(false);
  const [habitOpen, setHabitOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const habitsQ = useQuery({ queryKey: ['habits'], queryFn: listHabits });
  const todayLogsQ = useQuery({ queryKey: ['today', 'habit-logs'], queryFn: listTodayLogs });
  const priQ = useQuery({ queryKey: ['tasks', 'top'], queryFn: listTopPriorities });
  const blocksQ = useQuery({ queryKey: ['blocks', todayIso()], queryFn: () => listBlocksForDate() });
  const waterQ = useQuery({ queryKey: ['water', 'today'], queryFn: getWaterToday });
  const scoreQ = useQuery({ queryKey: ['score', todayIso()], queryFn: () => fetchScoreFor(todayIso()) });

  const todayHabits: Habit[] = (habitsQ.data ?? []).filter((h: Habit) => isHabitDueToday(h));
  const habitLogMap = new Map((todayLogsQ.data ?? []).map((l: HabitLog) => [l.habit_id, l]));
  const habitsDone = todayHabits.filter((h: Habit) => habitLogMap.has(h.id)).length;

  const tasks = priQ.data ?? [];
  const tasksDone = tasks.filter((t: Task) => t.status === 'done').length;

  const total = todayHabits.length + tasks.length;
  const done = habitsDone + tasksDone;
  const pct = total === 0 ? 0 : done / total;
  const pctLabel = `${Math.round(pct * 100)}%`;

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

  const quickMeal = useMutation({
    mutationFn: () => addMeal({ name: 'Meal', meal_type: 'meal' }),
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries(); },
  });

  const quickExpense = useMutation({
    mutationFn: () => addExpense({ amount: 0, category: 'general', note: 'Quick log' }),
    onSuccess: () => { tg.notify('success'); navigate('/more/money'); },
  });

  return (
    <div className="space-y-2 pt-2 pb-6">
      <Section title={longDate(new Date())}>
        <div className="-mt-1 mb-3">
          <h1 className="text-[28px] leading-tight font-bold">{greet}, {profile.first_name || 'friend'}.</h1>
          <div className="text-[14px] text-hint">Keep the momentum going.</div>
        </div>

        <Card>
          <div className="flex items-center gap-4">
            <ProgressRing value={pct} size={64} stroke={6} label={pctLabel} />
            <div className="flex-1">
              <div className="text-[16px] font-semibold">{pctLabel} complete</div>
              <div className="text-[13px] text-hint">{tasksDone} of {tasks.length} tasks · {habitsDone} of {todayHabits.length} habits</div>
            </div>
            {(scoreQ.data ?? 0) > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{scoreQ.data}</div>
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
            title={waterQ.data ? `Water +1` : 'Water +1'}
            hint={`${waterQ.data?.glasses ?? 0}/${waterQ.data?.target ?? 8} glasses`}
            onClick={() => waterPlus.mutate()}
          />
          <CheckInChip emoji="🍽️" title="Meal" hint="Quick meal" onClick={() => quickMeal.mutate()} />
          <CheckInChip emoji="💸" title="Expense" hint="Quick spend" onClick={() => quickExpense.mutate()} />
          <CheckInChip emoji="😴" title="Sleep" hint="Log sleep" onClick={() => navigate('/more/health')} />
        </div>
      </Section>

      {tasks.length === 0 && (
        <Section title="">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-[14px]">Step 1. Add one task that actually matters today.</div>
              <button onClick={() => setTaskOpen(true)} className="px-4 py-2 rounded-full bg-accent text-white text-[13px] font-semibold">Add task</button>
            </div>
          </Card>
        </Section>
      )}

      <Section title="Top priorities" action={<button onClick={() => setTaskOpen(true)} className="text-accent text-[13px]"><Plus size={14} className="inline -mt-0.5" /> Add</button>}>
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

      <Section title="Your day" action={<button onClick={() => setBlockOpen(true)} className="text-accent text-[13px]"><Plus size={14} className="inline -mt-0.5" /> Add</button>}>
        {(blocksQ.data ?? []).length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No time blocks scheduled.</div></Card>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {(blocksQ.data ?? []).map((b: TimeBlock) => (
              <TimeBlockRow key={b.id} block={b} onToggle={() => toggleBlk.mutate({ id: b.id, completed: !b.completed })} />
            ))}
          </div>
        )}
        <button
          onClick={() => setBlockOpen(true)}
          className="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-divider text-hint text-[13px] hover:border-accent hover:text-accent transition"
        >
          + Add time block
        </button>
      </Section>

      <Section title="Habits today" action={<button onClick={() => setHabitOpen(true)} className="text-accent text-[13px]"><Plus size={14} className="inline -mt-0.5" /> Add</button>}>
        {todayHabits.length === 0 ? (
          <EmptyState emoji="🔥" title="No habits for today" hint="Tap + to build one." />
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {todayHabits.map((h: Habit) => (
              <HabitRow
                key={h.id}
                habit={h}
                done={habitLogMap.has(h.id)}
                onToggle={() => toggleHabit.mutate({ id: h.id, done: habitLogMap.has(h.id) })}
              />
            ))}
          </div>
        )}
      </Section>

      <AddTaskSheet open={taskOpen} onClose={() => setTaskOpen(false)} />
      <AddHabitSheet open={habitOpen} onClose={() => setHabitOpen(false)} />
      <AddTimeBlockSheet open={blockOpen} onClose={() => setBlockOpen(false)} />
      <GlobalAddButton />
    </div>
  );
}
