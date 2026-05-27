import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive } from 'lucide-react';
import { Section } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { HabitRow } from '../components/HabitRow';
import { AddHabitSheet } from '../components/AddHabitSheet';
import {
  listHabits,
  listTodayLogs,
  toggleHabitToday,
  listHabitStreaks,
  listArchivedHabits,
} from '../api/habits';
import { tg } from '../lib/telegram';
import { useGate } from '../hooks/useGate';
import type { Habit, HabitLog } from '../types/db';

export default function HabitsScreen() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { gate } = useGate();

  const habitsQ = useQuery({ queryKey: ['habits'], queryFn: listHabits });
  const logsQ = useQuery({ queryKey: ['today', 'habit-logs'], queryFn: listTodayLogs });
  const streaksQ = useQuery({ queryKey: ['habit-streaks'], queryFn: listHabitStreaks });
  const archivedQ = useQuery({ queryKey: ['habits', 'archived'], queryFn: listArchivedHabits });

  const doneSet = new Set((logsQ.data ?? []).map((l: HabitLog) => l.habit_id));
  const streaks = streaksQ.data ?? new Map<string, number>();
  const habits = habitsQ.data ?? [];
  const archivedCount = (archivedQ.data ?? []).length;

  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => toggleHabitToday(id, done),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today'] });
      qc.invalidateQueries({ queryKey: ['habit-streaks'] });
      qc.invalidateQueries({ queryKey: ['score'] });
    },
  });

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Habits</h1>
            <div className="text-[14px] text-hint">Build consistency, one day at a time.</div>
          </div>
          <button
            onClick={gate(() => { tg.haptic('medium'); setOpen(true); })}
            className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </Section>

      {habits.length === 0 ? (
        <EmptyState
          emoji="🔥"
          title="No habits yet."
          hint="Small actions, done daily, compound into everything."
          action={<button onClick={gate(() => setOpen(true))} className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold">Add your first habit</button>}
        />
      ) : (
        <div className="px-4">
          <div className="rounded-2xl overflow-hidden">
            {habits.map((h: Habit) => (
              <HabitRow
                key={h.id}
                habit={h}
                done={doneSet.has(h.id)}
                streak={streaks.get(h.id) ?? 0}
                onToggle={() => toggle.mutate({ id: h.id, done: doneSet.has(h.id) })}
                onTap={() => navigate(`/habits/${h.id}`)}
                showChevron
              />
            ))}
          </div>
        </div>
      )}

      {archivedCount > 0 && (
        <div className="px-4 mt-4">
          <button
            onClick={() => { tg.haptic('light'); navigate('/habits/archived'); }}
            className="w-full flex items-center gap-3 bg-bg-2 rounded-2xl p-3 active:opacity-70 transition"
          >
            <div className="w-10 h-10 rounded-2xl bg-bg-3 flex items-center justify-center">
              <Archive size={18} className="text-amber-300" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[14px] font-semibold">Archived</div>
              <div className="text-[12px] text-hint">{archivedCount} habit{archivedCount === 1 ? '' : 's'} hidden — tap to restore</div>
            </div>
            <div className="text-hint">›</div>
          </button>
        </div>
      )}

      <AddHabitSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
