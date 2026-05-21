import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Moon, RotateCw, History as HistoryIcon, ChevronRight, Flame } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { RitualFlowSheet, type RitualField } from '../components/RitualFlowSheet';
import { listReviews, upsertReview, getReviewByDate } from '../api/structure';
import { fetchSummary } from '../api/daily';
import { dailyStreak, weeklyStreak, lastReviewDaysAgo } from '../lib/ritualStreaks';
import { todayIso } from '../lib/dates';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { tg } from '../lib/telegram';
import type { Review, DailySummary } from '../types/db';

type Tab = 'evening' | 'weekly' | 'history';

const EVENING_FIELDS: RitualField[] = [
  {
    key: 'highlights',
    title: 'What went well today?',
    hint: 'Wins big or small. Note what you want more of.',
    placeholder: 'I finished the report I was avoiding…',
    suggestions: ['Showed up for the workout', 'Finished a deep work block', 'Helped someone', 'Said no to something draining'],
  },
  {
    key: 'lowlights',
    title: "What didn't go well?",
    hint: 'Without judgment. Just naming it.',
    placeholder: 'Got pulled into Twitter for an hour…',
    suggestions: ['Scrolled too long', 'Skipped a habit', 'Reactive instead of proactive', 'Stayed up too late'],
  },
  {
    key: 'next_focus',
    title: 'One thing for tomorrow?',
    hint: 'The single thing that would make tomorrow feel like a win.',
    placeholder: 'Ship the proposal by lunch.',
    suggestions: ['Wake up at 7', 'Hit my habits before noon', 'One hour of deep work first thing'],
  },
];

const WEEKLY_FIELDS: RitualField[] = [
  {
    key: 'highlights',
    title: 'Wins of the week',
    hint: 'Look back at the days. What surprised you?',
    placeholder: '3 workouts done · finished proposal · read 80 pages',
    suggestions: ['Hit a streak milestone', 'Shipped a project', 'Showed up consistently', 'Made progress on a big goal'],
  },
  {
    key: 'lessons',
    title: 'Lessons from misses',
    hint: 'What got in the way? What would you do differently?',
    placeholder: 'Late-night phone wrecked my mornings.',
  },
  {
    key: 'next_focus',
    title: 'Focus for next week',
    hint: 'One sentence. The week is shaped by what you choose to focus on.',
    placeholder: 'Protect 90 minutes of deep work every morning.',
  },
];

export default function RitualsScreen() {
  const [tab, setTab] = useState<Tab>('evening');
  const [eveningOpen, setEveningOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);

  const reviewsQ = useQuery({ queryKey: ['reviews'], queryFn: () => listReviews(100) });
  const summaryQ = useQuery({ queryKey: ['summary', 7], queryFn: () => fetchSummary(7) });

  const reviews = (reviewsQ.data ?? []) as Review[];
  const summary7 = (summaryQ.data ?? []) as DailySummary[];

  const today = summary7.find((s) => s.day === todayIso());
  const week = summary7;

  const eStreak = dailyStreak(reviews);
  const wStreak = weeklyStreak(reviews);
  const eDaysSince = lastReviewDaysAgo(reviews, 'daily');
  const wDaysSince = lastReviewDaysAgo(reviews, 'weekly');

  return (
    <div className="pb-6">
      <Section title="">
        <h1 className="text-[28px] font-bold leading-tight mt-2">Rituals</h1>
        <div className="text-[14px] text-hint">Two short ceremonies that keep you honest with yourself.</div>
      </Section>

      <div className="px-4 mb-4">
        <div className="flex bg-bg-2 rounded-full p-1 gap-1">
          <TabButton active={tab === 'evening'} onClick={() => setTab('evening')} icon={<Moon size={14} />}>Evening</TabButton>
          <TabButton active={tab === 'weekly'} onClick={() => setTab('weekly')} icon={<RotateCw size={14} />}>Weekly</TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<HistoryIcon size={14} />}>History</TabButton>
        </div>
      </div>

      {tab === 'evening' && (
        <EveningTab
          today={today ?? null}
          streak={eStreak}
          daysSince={eDaysSince}
          onStart={() => { tg.haptic('medium'); setEveningOpen(true); }}
        />
      )}

      {tab === 'weekly' && (
        <WeeklyTab
          week={week}
          streak={wStreak}
          daysSince={wDaysSince}
          onStart={() => { tg.haptic('medium'); setWeeklyOpen(true); }}
        />
      )}

      {tab === 'history' && <HistoryTab reviews={reviews} />}

      <EveningSheet
        open={eveningOpen}
        onClose={() => setEveningOpen(false)}
        today={today ?? null}
      />
      <WeeklySheet
        open={weeklyOpen}
        onClose={() => setWeeklyOpen(false)}
        week={week}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={() => { tg.selection(); onClick(); }}
      className={`flex-1 py-2 rounded-full text-[13px] font-medium transition flex items-center justify-center gap-1.5 ${
        active ? 'bg-bg-4 text-text' : 'text-hint'
      }`}
    >
      {icon} {children}
    </button>
  );
}

function StreakChip({ streak, label }: { streak: number; label: string }) {
  if (streak === 0) return null;
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-300 text-[12px] font-semibold">
      <Flame size={12} className="flame-bob" />
      <span className="tabular-nums">{streak} {label}</span>
    </div>
  );
}

function EveningTab({ today, streak, daysSince, onStart }: { today: DailySummary | null; streak: number; daysSince: number | null; onStart: () => void }) {
  const habits = today ? `${today.habits_done} / ${today.habits_planned}` : '0 / 0';
  const tasks = today ? `${today.tasks_done} / ${today.tasks_total}` : '0 / 0';
  const water = today ? `${today.water_glasses} / ${today.water_target}` : '0 / 0';
  const blocks = today ? `${today.blocks_done} / ${today.blocks_total}` : '0 / 0';

  const dueLabel =
    daysSince === null ? 'Never reviewed.' :
    daysSince === 0 ? 'Logged today ✓' :
    daysSince === 1 ? 'Last reviewed yesterday' :
    `Last reviewed ${daysSince} days ago`;

  return (
    <>
      <Section title="">
        <div className="flex items-center justify-between px-4 mb-3">
          <div>
            <div className="text-[16px] font-semibold">{format(new Date(), 'EEEE, MMM d')}</div>
            <div className="text-[12px] text-hint">{dueLabel}</div>
          </div>
          <StreakChip streak={streak} label={`day${streak === 1 ? '' : 's'}`} />
        </div>
      </Section>

      <Section title="Today by the numbers">
        <div className="grid grid-cols-2 gap-2">
          <StatCard emoji="🔥" label="Habits" value={habits} />
          <StatCard emoji="✅" label="Tasks" value={tasks} />
          <StatCard emoji="💧" label="Water" value={water} />
          <StatCard emoji="📋" label="Blocks" value={blocks} />
        </div>
      </Section>

      <div className="px-4">
        <button
          onClick={onStart}
          className="w-full p-4 rounded-2xl bg-accent text-white text-left active:scale-[0.98] transition flex items-center gap-3"
        >
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">🌙</div>
          <div className="flex-1">
            <div className="font-bold text-[16px]">Start evening shutdown</div>
            <div className="text-[12px] opacity-85">3 questions · 2 minutes to close the day clean.</div>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </>
  );
}

function WeeklyTab({ week, streak, daysSince, onStart }: { week: DailySummary[]; streak: number; daysSince: number | null; onStart: () => void }) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  const last7 = week.slice(-7);

  const habitsDone = last7.reduce((s, r) => s + r.habits_done, 0);
  const habitsPlanned = last7.reduce((s, r) => s + r.habits_planned, 0);
  const tasksDone = last7.reduce((s, r) => s + r.tasks_done, 0);
  const tasksTotal = last7.reduce((s, r) => s + r.tasks_total, 0);
  const activeDays = last7.filter((r) => r.habits_done + r.tasks_done + r.blocks_done > 0).length;
  const habitRate = habitsPlanned === 0 ? 0 : Math.round((habitsDone / habitsPlanned) * 100);

  const bestDay = last7.reduce<DailySummary | null>((best, r) => {
    const s = r.habits_done + r.tasks_done + r.blocks_done;
    if (!best) return r;
    return s > (best.habits_done + best.tasks_done + best.blocks_done) ? r : best;
  }, null);

  const dueLabel =
    daysSince === null ? 'Never reviewed.' :
    daysSince <= 1 ? 'Reviewed this week ✓' :
    `Last reviewed ${daysSince} days ago`;

  return (
    <>
      <Section title="">
        <div className="flex items-center justify-between px-4 mb-3">
          <div>
            <div className="text-[16px] font-semibold">{format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}</div>
            <div className="text-[12px] text-hint">{dueLabel}</div>
          </div>
          <StreakChip streak={streak} label={`week${streak === 1 ? '' : 's'}`} />
        </div>
      </Section>

      <Section title="Week by the numbers">
        <div className="grid grid-cols-2 gap-2">
          <StatCard emoji="🔥" label="Habit rate" value={`${habitRate}%`} hint={`${habitsDone} logged`} />
          <StatCard emoji="✅" label="Tasks done" value={String(tasksDone)} hint={`${tasksTotal} planned`} />
          <StatCard emoji="📅" label="Active days" value={`${activeDays} / 7`} />
          {bestDay && (
            <StatCard emoji="⭐" label="Best day" value={format(new Date(bestDay.day), 'EEE')} hint={format(new Date(bestDay.day), 'MMM d')} />
          )}
        </div>
      </Section>

      <div className="px-4">
        <button
          onClick={onStart}
          className="w-full p-4 rounded-2xl bg-accent text-white text-left active:scale-[0.98] transition flex items-center gap-3"
        >
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center text-2xl">🔁</div>
          <div className="flex-1">
            <div className="font-bold text-[16px]">Start weekly review</div>
            <div className="text-[12px] opacity-85">3 questions · 5 minutes to reflect and plan ahead.</div>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </>
  );
}

function HistoryTab({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="px-4">
        <Card>
          <div className="text-hint text-sm text-center py-6">
            No reviews yet. Run your first ritual to start a record.
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div className="px-4 space-y-2">
      {reviews.map((r) => (
        <Card key={r.id}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[13px] font-semibold capitalize">{r.kind} review</div>
            <div className="text-[11px] text-hint">{format(new Date(r.review_date), 'EEE, MMM d, yyyy')}</div>
          </div>
          {r.highlights && (
            <div className="mt-2">
              <div className="text-[10px] text-hint tracking-wider uppercase">Highlights</div>
              <div className="text-[14px] mt-0.5 whitespace-pre-wrap">{r.highlights}</div>
            </div>
          )}
          {r.lowlights && (
            <div className="mt-2">
              <div className="text-[10px] text-hint tracking-wider uppercase">Lowlights</div>
              <div className="text-[14px] mt-0.5 whitespace-pre-wrap">{r.lowlights}</div>
            </div>
          )}
          {r.lessons && (
            <div className="mt-2">
              <div className="text-[10px] text-hint tracking-wider uppercase">Lessons</div>
              <div className="text-[14px] mt-0.5 whitespace-pre-wrap">{r.lessons}</div>
            </div>
          )}
          {r.next_focus && (
            <div className="mt-2">
              <div className="text-[10px] text-accent tracking-wider uppercase">Next focus</div>
              <div className="text-[14px] mt-0.5 whitespace-pre-wrap text-accent">{r.next_focus}</div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function StatCard({ emoji, label, value, hint }: { emoji: string; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-base">{emoji}</div>
        <div className="text-[10px] tracking-wider text-hint">{label}</div>
      </div>
      <div className="text-[20px] font-bold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-hint mt-0.5">{hint}</div>}
    </Card>
  );
}

function EveningSheet({ open, onClose, today }: { open: boolean; onClose: () => void; today: DailySummary | null }) {
  const qc = useQueryClient();
  const [initial, setInitial] = useState<Record<string, string>>({});

  // Pre-fill if a review already exists for today
  useQuery({
    queryKey: ['review', todayIso(), 'daily'],
    queryFn: async () => {
      const existing = await getReviewByDate(todayIso(), 'daily');
      if (existing) {
        setInitial({
          highlights: existing.highlights ?? '',
          lowlights: existing.lowlights ?? '',
          next_focus: existing.next_focus ?? '',
        });
      }
      return existing;
    },
    enabled: open,
  });

  const m = useMutation({
    mutationFn: (values: Record<string, string>) => upsertReview({
      kind: 'daily',
      review_date: todayIso(),
      highlights: values.highlights || '',
      lowlights: values.lowlights || '',
      next_focus: values.next_focus || '',
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['review'] });
      onClose();
    },
  });

  const intro = (
    <div>
      <div className="text-5xl mb-3">🌙</div>
      <h2 className="text-[22px] font-bold leading-tight">Close out the day.</h2>
      <p className="text-[13px] text-hint mt-1">Three questions. Two minutes. Sleep with a clean mind.</p>

      {today && (
        <div className="mt-4 bg-bg-3 rounded-2xl p-3">
          <div className="text-[11px] text-hint tracking-wider uppercase mb-2">Today</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-hint">Habits</div>
              <div className="text-[15px] font-semibold tabular-nums">{today.habits_done}/{today.habits_planned}</div>
            </div>
            <div>
              <div className="text-[10px] text-hint">Tasks</div>
              <div className="text-[15px] font-semibold tabular-nums">{today.tasks_done}/{today.tasks_total}</div>
            </div>
            <div>
              <div className="text-[10px] text-hint">Water</div>
              <div className="text-[15px] font-semibold tabular-nums">{today.water_glasses}/{today.water_target}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <RitualFlowSheet
      open={open}
      onClose={onClose}
      title="Evening shutdown"
      intro={intro}
      fields={EVENING_FIELDS}
      initialValues={initial}
      onSubmit={(v) => m.mutateAsync(v).then(() => undefined)}
      submitting={m.isPending}
    />
  );
}

function WeeklySheet({ open, onClose, week }: { open: boolean; onClose: () => void; week: DailySummary[] }) {
  const qc = useQueryClient();
  const [initial, setInitial] = useState<Record<string, string>>({});
  const sunday = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  useQuery({
    queryKey: ['review', sunday, 'weekly'],
    queryFn: async () => {
      const existing = await getReviewByDate(sunday, 'weekly');
      if (existing) {
        setInitial({
          highlights: existing.highlights ?? '',
          lessons: existing.lessons ?? '',
          next_focus: existing.next_focus ?? '',
        });
      }
      return existing;
    },
    enabled: open,
  });

  const m = useMutation({
    mutationFn: (values: Record<string, string>) => upsertReview({
      kind: 'weekly',
      review_date: sunday,
      highlights: values.highlights || '',
      lessons: values.lessons || '',
      next_focus: values.next_focus || '',
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['review'] });
      onClose();
    },
  });

  const last7 = week.slice(-7);
  const habitsDone = last7.reduce((s, r) => s + r.habits_done, 0);
  const tasksDone = last7.reduce((s, r) => s + r.tasks_done, 0);
  const activeDays = last7.filter((r) => r.habits_done + r.tasks_done + r.blocks_done > 0).length;

  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const intro = (
    <div>
      <div className="text-5xl mb-3">🔁</div>
      <h2 className="text-[22px] font-bold leading-tight">Reset for the week.</h2>
      <p className="text-[13px] text-hint mt-1">3 questions · 5 minutes. Set up the next 7 days.</p>
      <div className="text-[12px] text-hint mt-2">Week of {format(start, 'MMM d')} – {format(subDays(start, -6), 'MMM d')}</div>

      <div className="mt-4 bg-bg-3 rounded-2xl p-3">
        <div className="text-[11px] text-hint tracking-wider uppercase mb-2">Last 7 days</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-hint">Habits</div>
            <div className="text-[15px] font-semibold tabular-nums">{habitsDone}</div>
          </div>
          <div>
            <div className="text-[10px] text-hint">Tasks</div>
            <div className="text-[15px] font-semibold tabular-nums">{tasksDone}</div>
          </div>
          <div>
            <div className="text-[10px] text-hint">Active days</div>
            <div className="text-[15px] font-semibold tabular-nums">{activeDays}/7</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <RitualFlowSheet
      open={open}
      onClose={onClose}
      title="Weekly review"
      intro={intro}
      fields={WEEKLY_FIELDS}
      initialValues={initial}
      onSubmit={(v) => m.mutateAsync(v).then(() => undefined)}
      submitting={m.isPending}
    />
  );
}

