import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, Archive, Flame } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { Sheet } from '../components/Sheet';
import { TextField, Chip } from '../components/Input';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { CountUp } from '../components/CountUp';
import {
  listHabits,
  listHabitLogs,
  habitStreak,
  updateHabit,
  archiveHabit,
  deleteHabit,
  isHabitDueToday,
} from '../api/habits';
import { format } from 'date-fns';
import { tg } from '../lib/telegram';
import type { Habit, HabitLog, Frequency } from '../types/db';

const EMOJIS = ['🔥', '💧', '🏃', '📚', '🧘', '💪', '🥗', '😴', '🧠', '✍️', '🎵', '☀️'];

export default function HabitDetailScreen() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const habitsQ = useQuery({ queryKey: ['habits'], queryFn: listHabits });
  const logsQ = useQuery({ queryKey: ['habit-logs', id], queryFn: () => listHabitLogs(id, 120), enabled: Boolean(id) });
  const streakQ = useQuery({ queryKey: ['habit-streak', id], queryFn: () => habitStreak(id), enabled: Boolean(id) });

  const habit = (habitsQ.data ?? []).find((h: Habit) => h.id === id);

  const archiveM = useMutation({
    mutationFn: () => archiveHabit(id),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['habits'] });
      navigate('/habits');
    },
  });

  const deleteM = useMutation({
    mutationFn: () => deleteHabit(id),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['habits'] });
      navigate('/habits');
    },
  });

  if (habitsQ.isLoading) {
    return <div className="p-6 text-hint text-center">Loading…</div>;
  }
  if (!habit) {
    return (
      <div className="p-6 text-center">
        <div className="text-2xl mb-2">🤷</div>
        <div className="text-hint mb-4">Habit not found.</div>
        <button onClick={() => navigate('/habits')} className="px-5 py-2 rounded-full bg-accent text-white text-sm font-semibold">
          Back to habits
        </button>
      </div>
    );
  }

  const logs = (logsQ.data ?? []) as HabitLog[];
  const streak = streakQ.data ?? 0;
  const longest = computeLongestStreak(logs);
  const totalLogged = logs.length;

  // Compute completion rate over last 30 due days
  const stats = completionStats(habit, logs, 30);

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start gap-3">
          <div className="text-4xl">{habit.emoji || '🔥'}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] font-bold leading-tight truncate">{habit.name}</h1>
            {habit.description && <div className="text-[14px] text-hint mt-1">{habit.description}</div>}
            <div className="text-[12px] text-hint mt-1 capitalize">{habit.frequency.replace('_', ' ')}</div>
          </div>
          <button
            onClick={() => { tg.haptic('light'); setEditOpen(true); }}
            className="w-9 h-9 rounded-full bg-bg-3 flex items-center justify-center active:opacity-70"
            aria-label="Edit habit"
          >
            <Pencil size={16} />
          </button>
        </div>
      </Section>

      <Section title="">
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <div className="flex items-center gap-1 text-orange-300 text-[12px] tracking-wider uppercase mb-1">
              <Flame size={14} className="flame-bob" /> Streak
            </div>
            <div className="text-2xl font-bold tabular-nums">
              <CountUp value={streak} />
            </div>
            <div className="text-[11px] text-hint">{streak === 1 ? 'day' : 'days'}</div>
          </Card>
          <Card>
            <div className="text-[12px] text-hint tracking-wider uppercase mb-1">Longest</div>
            <div className="text-2xl font-bold tabular-nums">{longest}</div>
            <div className="text-[11px] text-hint">{longest === 1 ? 'day' : 'days'}</div>
          </Card>
          <Card>
            <div className="text-[12px] text-hint tracking-wider uppercase mb-1">30-day</div>
            <div className="text-2xl font-bold tabular-nums">
              <CountUp value={stats.rate} format={(v) => `${Math.round(v)}%`} />
            </div>
            <div className="text-[11px] text-hint">{stats.done}/{stats.due} due</div>
          </Card>
        </div>
      </Section>

      <Section title="Last 14 weeks">
        <Card>
          <HabitHeatmap habit={habit} logs={logs} weeks={14} />
          <div className="flex items-center gap-3 mt-3 text-[10px] text-hint">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-[2px] bg-green-500/80" /> Done</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-[2px] bg-bg-4" /> Missed</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-[2px] bg-bg-3 opacity-50" /> Not due</div>
          </div>
        </Card>
      </Section>

      <Section title="Recent log">
        {logs.length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No logs yet. Mark this habit done on Today to start your streak.</div></Card>
        ) : (
          <Card>
            <div className="text-[13px] text-hint">{totalLogged} total log{totalLogged === 1 ? '' : 's'} · last on {format(new Date(logs[0].log_date), 'EEE, MMM d')}</div>
          </Card>
        )}
      </Section>

      <Section title="Danger zone">
        <div className="space-y-2">
          <button
            onClick={async () => {
              if (await tg.showConfirm(`Archive "${habit.name}"? It'll stop appearing in lists but the history is kept.`)) {
                archiveM.mutate();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-2 text-amber-300 text-[14px] font-medium active:opacity-60"
          >
            <Archive size={15} /> Archive
          </button>
          <button
            onClick={async () => {
              if (await tg.showConfirm(`Delete "${habit.name}" and ALL its history? Cannot be undone.`)) {
                deleteM.mutate();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-2 text-red-400 text-[14px] font-medium active:opacity-60"
          >
            <Trash2 size={15} /> Delete forever
          </button>
        </div>
      </Section>

      <EditHabitSheet key={habit.id} open={editOpen} onClose={() => setEditOpen(false)} habit={habit} />
    </div>
  );
}

function computeLongestStreak(logs: HabitLog[]): number {
  if (logs.length === 0) return 0;
  const dates = logs.map((l) => l.log_date).sort();
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      cur += 1;
      longest = Math.max(longest, cur);
    } else if (diff > 1) {
      cur = 1;
    }
  }
  return longest;
}

function completionStats(habit: Habit, logs: HabitLog[], days: number): { done: number; due: number; rate: number } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  let due = 0;
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (isHabitDueToday(habit, new Date(d))) due++;
  }
  const startIso = start.toISOString().slice(0, 10);
  const todayIsoStr = today.toISOString().slice(0, 10);
  const done = logs.filter((l) => l.log_date >= startIso && l.log_date <= todayIsoStr).length;
  return { done, due, rate: due === 0 ? 0 : (done / due) * 100 };
}

function EditHabitSheet({ open, onClose, habit }: { open: boolean; onClose: () => void; habit: Habit }) {
  const qc = useQueryClient();
  const [name, setName] = useState(habit.name);
  const [emoji, setEmoji] = useState(habit.emoji);
  const [freq, setFreq] = useState<Frequency>(habit.frequency);

  useEffect(() => {
    setName(habit.name);
    setEmoji(habit.emoji);
    setFreq(habit.frequency);
  }, [habit.id]);

  const saveM = useMutation({
    mutationFn: () => updateHabit(habit.id, {
      name: name.trim(),
      emoji,
      frequency: freq,
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['habits'] });
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="Edit habit">
      <div className="space-y-3 pt-2">
        <TextField value={name} onChange={(e) => setName(e.target.value)} placeholder="Habit name…" />
        <div className="flex gap-2">
          <Chip active={freq === 'daily'} onClick={() => setFreq('daily')}>Daily</Chip>
          <Chip active={freq === 'weekdays'} onClick={() => setFreq('weekdays')}>Weekdays</Chip>
          <Chip active={freq === 'weekends'} onClick={() => setFreq('weekends')}>Weekends</Chip>
        </div>
        <div>
          <div className="text-xs text-hint mb-2 tracking-wider uppercase">Icon</div>
          <div className="grid grid-cols-6 gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => { tg.selection(); setEmoji(e); }}
                className={`text-xl py-2 rounded-xl ${emoji === e ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg-3'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => saveM.mutate()}
          disabled={!name.trim() || saveM.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {saveM.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Sheet>
  );
}
